import { ClaudeWeaverTool } from "../tool"
type TimeRangeOpts = {
    day: string,
    week: string,
    month: string,
    year: string,
}

interface SearchWebWithGoogleToolParams { query: string; searchType?: string; timeRange?: string }

export default class SearchWebWithGoogleTool extends ClaudeWeaverTool<SearchWebWithGoogleToolParams, any> {
        async execute({ query, searchType = 'search', timeRange }: SearchWebWithGoogleToolParams): Promise<any> {
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

        const returnKeys = {
            images: 'images',
            videos: 'videos',
            places: 'places',
            maps: 'places',
            news: 'news',
            shopping: 'shopping',
        };

        const returnKey = returnKeys[searchType as keyof typeof returnKeys] || 'organic';

        return responseJson[returnKey];
    };
}