import weaviate, { generative } from "weaviate-client";

// Script for initialising Weaviate vector database
async function main() {

  const client = await weaviate.connectToLocal();

  const noteCollectionSchema = {
    name: 'Note',
    properties: [{
      name: 'content',
      dataType: 'text'
    },
    {
      name: 'context',
      dataType: 'text'
    },
    {
      name: 'createdAt',
      dataType: 'date'
    }
    ],
    generative: generative.openAI({
      model: "gpt-4"
    })
  }

  const noteCollectionExists = await client.collections.exists('Note');

  if (noteCollectionExists) {
    await client.collections.delete('Note');
  }

  const notesCollection = await client.collections.create(noteCollectionSchema);

  console.log('Collection created: ', notesCollection);
}

main();
