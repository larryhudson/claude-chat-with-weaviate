import { db } from "@/lib/db";
import { ClaudeWeaverTool } from "../tool"

export default class DeleteAllNotesTool extends ClaudeWeaverTool<{}, void> {
    async execute(params: {} = {}): Promise<void> {
        const weaviateClient = await this.getDb();
        const notesCollection = weaviateClient.collections.get('Note');

        await notesCollection.data.deleteMany(
        notesCollection.filter.byProperty('content').like('*')
        );
    }
}