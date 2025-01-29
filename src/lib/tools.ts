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

type TimeRangeOpts = {
  day: string,
  week: string,
  month: string,
  year: string,
}

export const searchWebWithGoogle = async ({ query, searchType = 'search', timeRange }: { query: string; searchType?: string; timeRange?: string }): Promise<any> => {
  const timeRangeOptions: TimeRangeOpts = {
    'day': 'qdr:d',
    'week': 'qdr:w',
    'month': 'qdr:m',
    'year': 'qdr:y',
  };

  const timeRangeValue = timeRangeOptions[timeRange as keyof TimeRangeOpts] || undefined;

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
    } as any
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

type ArticleType = {
  title: string,
  content: string,
  textContent: string,
  excerpt: string,
  byline: string,
  length: number
}

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
        if(button.textContent){        
          if (button.textContent.toLowerCase().includes('accept') ||
            button.textContent.toLowerCase().includes('agree') ||
            button.textContent.toLowerCase().includes('ok')) {
            button.click();
            return;
          }
        }
      }
    });

    await page.waitForTimeout(2000);

    const content = await page.content();

    const doc = new JSDOM(content);
    const reader = new Readability(doc.window.document);
    const article = reader.parse() as unknown as ArticleType;

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

export { toolDefinitions } from "@/tools";

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
