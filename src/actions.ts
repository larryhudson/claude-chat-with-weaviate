"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {db} from "@/lib/db";

export async function updateNote(noteId, values) {
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');
  await notesCollection.data.update({
    id: noteId,
    properties: values,
  });
  revalidatePath('/notes');
}

export async function deleteNote(formData) {
  const noteId = formData.get('noteId');
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');
  await notesCollection.data.deleteById(noteId);
  revalidatePath('/notes');

  return redirect('/notes');
}
