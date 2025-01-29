// tools.ts
import {db} from "./db";
import cheerio from 'cheerio';
import Parser from 'rss-parser';
import { YoutubeTranscript } from 'youtube-transcript';
import { chromium } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";

// Helper function to format time
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const generateRandomNumber = async ({ min, max }: { min: number; max: number }): Promise<number> => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const searchWebWithGoogle = async ({ query, searchType = 'search', timeRange }: { query: string; searchType?: string; timeRange?: string }): Promise<any> => {
  const timeRangeOptions = {
    'day': 'qdr:d',
    'week': 'qdr:w',
    'month': 'qdr:m',
    'year': 'qdr:y',
  };

  const timeRangeValue = timeRangeOptions[timeRange] || undefined;

  const serperUrl = `https://google.serper.dev/${searchType}`;
  const searchOptions = {
    q: query,
    tbs: timeRangeValue,
    gl: 'au', // Google locale
  };

  const response = await fetch(serperUrl, {
    method: 'POST',
    body: JSON.stringify(searchOptions),
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseJson = await response.json();

  const returnKey = {
    images: 'images',
    videos: 'videos',
    places: 'places',
    maps: 'places',
    news: 'news',
    shopping: 'shopping',
  }[searchType] || 'organic';

  return responseJson[returnKey];
};

export const getMarkdownForUrl = async ({ url }: { url: string }): Promise<string> => {
  const jinaReaderUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(jinaReaderUrl);
  return await response.text();
};

export const getReadableContentForUrl = async ({ url }: { url: string }): Promise<any> => {
  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForSelector('main, article, #content, .content', { timeout: 10000 })
      .catch(() => console.log('Main content selector not found, proceeding anyway.'));

    await page.evaluate(() => {
      const cookieButtons: NodeListOf<HTMLLinkElement> = document.querySelectorAll('button, a, span');
      for (const button of cookieButtons) {
        if (button.textContent.toLowerCase().includes('accept') ||
          button.textContent.toLowerCase().includes('agree') ||
          button.textContent.toLowerCase().includes('ok')) {
          button.click();
          return;
        }
      }
    });

    await page.waitForTimeout(2000);

    const content = await page.content();

    const doc = new JSDOM(content);
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    return {
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      excerpt: article.excerpt,
      byline: article.byline,
      length: article.length
    };
  } finally {
    await browser.close();
  }
};

export const getHtmlForUrl = async ({ url }: { url: string }): Promise<string> => {
  const response = await fetch(url);
  return await response.text();
};

export const searchNotes = async ({ query }: { query: string }): Promise<any> => {
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');

  const queryResponse = await notesCollection.query.hybrid(query, {
    limit: 5
  });

  return queryResponse.objects;
};

export const addNote = async ({ content, context }: { content: string; context: string }): Promise<any> => {
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');

  const createdNote = await notesCollection.data.insert({
    content,
    context,
    createdAt: new Date(),
  });

  if (!createdNote) {
    throw new Error('Failed to create note');
  }

  return createdNote;
};

export const updateNote = async ({ id, content, context }: { id: string; content: string; context: string }): Promise<boolean> => {
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');

  await notesCollection.data.update({
    id,
    properties: {
      content,
      context,
    }
  });

  return true;
};

export const deleteNote = async ({ id }: { id: string }): Promise<boolean> => {
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');

  await notesCollection.data.deleteById(id);

  return true;
};

export const deleteAllNotes = async (): Promise<void> => {
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');

  await notesCollection.data.deleteMany(
    notesCollection.filter.byProperty('content').like('*')
  );
};

export const findRssFeeds = async ({ url }: { url: string }): Promise<{ feedUrls: string[] } | { error: string }> => {
  try {
    const response = await fetch(url);
    const responseText = await response.text();
    const $ = cheerio.load(responseText);
    const rssLinks = $('link[type="application/rss+xml"], link[type="application/atom+xml"]');
    if (rssLinks.length === 0) {
      return { error: 'No RSS feed found on the given website.' };
    }
    const feedUrls = rssLinks.map((_, link) => {
      const relativeUrl = $(link).attr('href');
      if (!relativeUrl) return null;
      return new URL(relativeUrl, url).href;
    }).get().filter(Boolean);

    return { feedUrls };
  } catch (error) {
    console.error('Error finding RSS feed:', error);
    return { error: 'Failed to find RSS feed. Please check the URL and try again.' };
  }
};

export const fetchRssFeed = async ({ feedUrl, maxArticles = 5 }: { feedUrl: string; maxArticles?: number }): Promise<any> => {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL(feedUrl);
    const articles = feed.items.slice(0, maxArticles).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet,
    }));
    return { feedUrl, articles };
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return { error: 'Failed to fetch RSS feed. Please check the URL and try again.' };
  }
};

export const extractYoutubeTranscript = async ({ videoUrl }: { videoUrl: string }): Promise<{ transcript: string } | { error: string }> => {
  try {
    const videoId = videoUrl.split('v=')[1];
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const formattedTranscript = transcript.map(entry => {
      return `[${formatTime(entry.offset)}] ${entry.text}`;
    }).join('\n');

    return { transcript: formattedTranscript };
  } catch (error) {
    console.error('Error extracting YouTube transcript:', error);
    return { error: 'Failed to extract transcript. Please check the URL and try again.' };
  }
};

export const toolDefinitions: Tool[] = [
  {
    name: 'generate_random_number',
    description: 'Generate a random number between the minimum and maximum values',
    input_schema: {
      type: 'object',
      properties: {
        min: {
          type: 'number',
          description: 'Minimum value',
        },
        max: {
          type: 'number',
          description: 'Maximum value',
        }
      },
      required: ['min', 'max'],
    },
  },
  {
    name: 'search_web_with_google',
    description: 'Search web for a query with Google. When using these results, return hyperlinks in Markdown format.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Query to search for. Use "site:" followed by a domain to filter by domain.',
        },
        searchType: {
          type: 'string',
          description: 'Type of search to perform. Use the default unless a specific search type is necessary',
          enum: ['search', 'images', 'videos', 'places', 'maps', 'news', 'shopping', 'scholar', 'patents'],
          default: 'search'
        },
        timeRange: {
          type: 'string',
          description: 'The time range to find articles published in',
          enum: ['day', 'week', 'month', 'year'],
        }
      },
      required: ['topic'],
    },
  },
  {
    name: 'get_markdown_for_url',
    description: 'Retrieve the full text content for a URL as Markdown.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to retrieve content for',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_readable_content_for_url',
    description: 'Retrieve the main content of a webpage using Playwright and Readability',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the webpage to extract content from',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_html_for_url',
    description: 'Retrieve the full HTML response for a URL.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to retrieve content for',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'search_notes',
    description: 'Search notes for a query',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Query to search notes for',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_note',
    description: 'Add a note with content and context',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Content of the note',
        },
        context: {
          type: 'string',
          description: 'Conversational context of the note',
        },
      },
      required: ['content', 'context'],
    },
  },
  {
    name: 'update_note',
    description: 'Update an existing note with content and context. Use this if the information in a note is outdated.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the note',
        },
        content: {
          type: 'string',
          description: 'Content of the note',
        },
        context: {
          type: 'string',
          description: 'Conversational context of the note',
        },
      },
      required: ['id', 'content', 'context'],
    },
  },
  {
    name: 'delete_note',
    description: 'Delete a note with id. Only do this if the user has told you to forget about something.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the note to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_all_notes',
    description: 'Delete all notes. Only do this if the user has explicitly told you to do so.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'find_rss_feeds',
    description: 'Find linked RSS feeds on a given website.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the website to search for RSS feed',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'fetch_rss_feed',
    description: 'Fetches RSS feed and returns recent articles.',
    input_schema: {
      type: 'object',
      properties: {
        feedUrl: {
          type: 'string',
          description: 'URL of the RSS feed',
        },
        maxArticles: {
          type: 'number',
          description: 'Maximum number of recent articles to fetch (default: 5)',
          default: 5,
        },
      },
      required: ['feedUrl'],
    },
  },
  {
    name: 'extract_youtube_transcript',
    description: 'Extract transcript from a YouTube video URL',
    input_schema: {
      type: 'object',
      properties: {
        videoUrl: {
          type: 'string',
          description: 'URL of the YouTube video',
        },
      },
      required: ['videoUrl'],
    },
  },
];

export const toolHandlers = {
  generate_random_number: generateRandomNumber,
  search_web_with_google: searchWebWithGoogle,
  get_markdown_for_url: getMarkdownForUrl,
  get_readable_content_for_url: getReadableContentForUrl,
  get_html_for_url: getHtmlForUrl,
  search_notes: searchNotes,
  add_note: addNote,
  update_note: updateNote,
  delete_note: deleteNote,
  delete_all_notes: deleteAllNotes,
  find_rss_feeds: findRssFeeds,
  fetch_rss_feed: fetchRssFeed,
  extract_youtube_transcript: extractYoutubeTranscript,
};
