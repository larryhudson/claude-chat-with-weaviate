import { redirect } from 'next/navigation';
import weaviate from "weaviate-client";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

// This is a React server action for deleting the note
import { deleteNote } from "@/actions";

// Asynchronous function for getting the note data
// Because this page is a server component, this happens on the server
async function getNoteData(noteId) {
    const weaviateClient = await weaviate.connectToLocal();
    const notesCollection = weaviateClient.collections.get('Note');
    const note = await notesCollection.query.fetchObjectById(noteId);
    return note.properties;
}

export default async function DeleteNotePage({ params }) {
    const noteId = params.noteId;
    const noteData = await getNoteData(noteId);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Delete Note</h1>
            <Card>
                <CardContent className="pt-6">
                    <p className="mb-2">Are you sure you want to delete this note? This action cannot be undone.</p>
                    <p><strong>Context:</strong> {noteData.context}</p>
                    <p><strong>Content:</strong> {noteData.content.substring(0, 100)}...</p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" asChild>
                        <a href="/notes">Cancel</a>
                    </Button>
                    <form action={deleteNote}>
                        <input type="hidden" name="noteId" value={noteId} />
                        <Button variant="destructive" type="submit">Delete Note</Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
