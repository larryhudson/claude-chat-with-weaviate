import { ClaudeWeaverTool } from "./_tool"

interface HTMLForURLParams {
    url: string
}

export default class HTMLForURL extends ClaudeWeaverTool<HTMLForURLParams, string> {
    async execute({url}: HTMLForURLParams): Promise<string> {
        const response = await fetch(url);
        return await response.text(); 
    }
}