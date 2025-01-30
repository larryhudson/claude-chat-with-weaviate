import { ClaudeWeaverTool } from "./_tool"

interface MDForURLParams {
    url: string
}
export default class MDForURL extends ClaudeWeaverTool<MDForURLParams, string> {
    public async execute({url}: MDForURLParams): Promise<string> {
        const jinaReaderUrl = `https://r.jina.ai/${url}`;
        const response = await fetch(jinaReaderUrl);
        return await response.text(); 
    }
}