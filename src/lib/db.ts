import weaviate, {WeaviateClient} from 'weaviate-client';

export const db = {
    connect: async (): Promise<WeaviateClient> => {        
        return await weaviate.connectToLocal({
            host: process.env.WEAVIATE_HOST || 'localhost',
            port: parseInt(process.env.WEAVIATE_PORT)
        });
    }
}

