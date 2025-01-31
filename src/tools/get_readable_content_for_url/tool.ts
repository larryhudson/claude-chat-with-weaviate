import { ClaudeWeaverTool } from "../tool"
import { chromium } from "playwright";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

interface ReadableForURLParams {
    url: string
}

type ArticleType = {
    title: string,
    content: string,
    textContent: string,
    excerpt: string,
    byline: string,
    length: number
}

export default class ReadableForURL extends ClaudeWeaverTool<ReadableForURLParams, ArticleType> {
    async execute({ url } : ReadableForURLParams): Promise<ArticleType>
    {
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
    }
}