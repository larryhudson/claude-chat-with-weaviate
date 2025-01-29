import Chat from "@/components/Chat";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {db} from "@/lib/db";


// Get the number of notes in Weaviate database
// If  the number is zero, the 'welcome dialog' will be displayed.
async function getNotesCount() {
  const weaviateClient = await db.connect();
  const notesCollection = weaviateClient.collections.get('Note');

  const queryResponse = await notesCollection.query.fetchObjects();

  return queryResponse.objects.length;
}


export default async function Home() {
  try {
    const initialNotesCount = await getNotesCount();
    return (
      <Chat initialNotesCount={initialNotesCount} />
    );
  }
  catch (error) {
    return <Alert variant="destructive">
      <AlertTitle>Error while connecting to Weaviate</AlertTitle>
      <AlertDescription>Please make sure Weaviate is running and initialised.</AlertDescription>
    </Alert>
  }
}
