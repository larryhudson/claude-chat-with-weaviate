import React from 'react';
import {db} from "../../lib/db";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/NoteCard";

type Note = {
  id: string;
  content: string;
  context: string;
  createdAt: string;
};

// Asynchronous function for fetching the Weaviate notes from the database
// Because this page is a server component, this fetching will happen on the server
const fetchNotes = async (searchQuery?: string): Promise<Note[]> => {
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');

  function getQueryResponse(searchQuery?: string) {
    if (searchQuery) {
      return notesCollection.query.hybrid(searchQuery);
    } else {
      return notesCollection.query.fetchObjects({
        sort: notesCollection.sort.byCreationTime(false)
      });
    }
  }

  const queryResponse = await getQueryResponse(searchQuery);

  const notes = queryResponse.objects.map(object => ({
    id: object.uuid,
    ...object.properties
  })) as Note[];

  return notes;
};

export default async function NotesPage({ searchParams }: { searchParams: any }) {
  try {
    const searchQuery = searchParams.q;
    const notes = await fetchNotes(searchQuery);

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Notes</h1>
        <form className="mb-4">
          <input type="search" name="q" placeholder="Search notes" defaultValue={searchQuery} className="p-2 border border-gray-300 rounded-lg" />
          <Button type="submit" className="ml-2">Search</Button>
        </form>
        {notes.length === 0 ? (
          <p>No notes found.</p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    );
  }
  catch (error) {
    return <Alert variant="destructive">
      <AlertTitle>Error while connecting to Weaviate</AlertTitle>
      <AlertDescription>Please make sure Weaviate is running and initialised.</AlertDescription>
    </Alert>
  }
}
