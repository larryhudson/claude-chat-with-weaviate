import { db } from "@/lib/db";
import { ClaudeWeaverTool } from "./_tool"

interface DeleteNoteToolParams {
    id: string
}

export default class DeleteNoteTool extends ClaudeWeaverTool<DeleteNoteToolParams, boolean> {
    async execute({id}: DeleteNoteToolParams){
        const weaviateClient = await db.connect();
        const notesCollection = weaviateClient.collections.get('Note');

        await notesCollection.data.deleteById(id);

        return true;
    }
}