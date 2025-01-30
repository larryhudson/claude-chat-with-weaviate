import { db } from "@/lib/db";
import { ClaudeWeaverTool } from "./_tool"

export default class DeleteAllNotesTool extends ClaudeWeaverTool<{}, void> {
    async execute(params: {} = {}): Promise<void> {
        const weaviateClient = await db.connect();
        const notesCollection = weaviateClient.collections.get('Note');

        await notesCollection.data.deleteMany(
        notesCollection.filter.byProperty('content').like('*')
        );
    }
}