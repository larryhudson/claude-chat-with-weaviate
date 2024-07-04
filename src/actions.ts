"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import weaviate from "weaviate-client";

export async function updateNote(noteId, values) {
  const weaviateClient = await weaviate.connectToLocal();
  const notesCollection = weaviateClient.collections.get('Note');
  await notesCollection.data.update({
    id: noteId,
    properties: values,
  });
  revalidatePath('/notes');
}

export async function deleteNote(formData) {
  const noteId = formData.get('noteId');
  const weaviateClient = await weaviate.connectToLocal();
  const notesCollection = weaviateClient.collections.get('Note');
  await notesCollection.data.deleteById(noteId);
  revalidatePath('/notes');

  return redirect('/notes');
}
