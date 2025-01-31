import { ClaudeWeaverTool } from "../tool"
import * as cheerio from 'cheerio';

interface FindRSSToolParams {
    url: string
}

export default class FindRSSTool extends ClaudeWeaverTool<FindRSSToolParams, any> {
 async execute({url}: FindRSSToolParams): Promise<{ feedUrls?: string[], error?: string}> {
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
 }
}