import weaviate, { generative, CollectionConfigCreate, Properties } from "weaviate-client";
import dotenv from 'dotenv';
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, '..', '.env.local')
})

// Script for initialising Weaviate vector database
async function main() {  
  const client = await weaviate.connectToLocal({
    host: process.env.WEAVIATE_HOST || 'localhost',
    port: parseInt(process.env.WEAVIATE_PORT || '8080')
  });

  const noteCollectionSchema: CollectionConfigCreate<Properties, string> = {
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
      model: 'gpt-4'
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
