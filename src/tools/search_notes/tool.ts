import { db } from "@/lib/db";
import { ClaudeWeaverTool } from "../tool"

interface SearchNotesToolParams {
    query: string
}

export default class SearchNotesTool extends ClaudeWeaverTool<SearchNotesToolParams, any>
{
    async execute({query}: SearchNotesToolParams): Promise<any> {
        const weaviateClient = await this.getDb();
        const notesCollection = weaviateClient.collections.get('Note');
    
        const queryResponse = await notesCollection.query.hybrid(query, {
        limit: 5
        });
    
        return queryResponse.objects;
    }
}