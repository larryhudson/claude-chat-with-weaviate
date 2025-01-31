import { db } from "@/lib/db";
import { ClaudeWeaverTool } from "../tool"

interface UpdateNoteToolParams {
   id: string; content: string; context: string
}

export default class UpdateNoteTool extends ClaudeWeaverTool<UpdateNoteToolParams, any> {
    public async execute({ id, content, context}: UpdateNoteToolParams): Promise<any> {
        const weaviateClient = await this.getDb();
        const notesCollection = weaviateClient.collections.get('Note');
      
        await notesCollection.data.update({
          id,
          properties: {
            content,
            context,
          }
        });
      
        return true;
    }
}