import { ClaudeWeaverTool } from "./_tool"
import Parser from 'rss-parser';

interface FetchRSSToolParams {
    feedUrl: string; maxArticles?: number
}

export default class FetchRSSTool extends ClaudeWeaverTool<FetchRSSToolParams, any> {
    async execute({feedUrl, maxArticles = 5}: FetchRSSToolParams){
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
    }
}