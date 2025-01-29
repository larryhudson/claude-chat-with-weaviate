import {db} from "@/lib/db";
import EditNoteForm from "@/components/EditNoteForm";

async function getNoteData(noteId: string) {
    const weaviateClient = await db.connect();
    const notesCollection = weaviateClient.collections.get('Note');
    const note = await notesCollection.query.fetchObjectById(noteId);
    if (!note) {
        throw new Error(`Note with ID ${noteId} not found`);
    }
    return note.properties;
}

export default async function EditNotePage({ params }) {
    const noteId = params.noteId;
    const noteData = await getNoteData(noteId);
    return <EditNoteForm noteId={noteId} initialData={noteData} />;
}
