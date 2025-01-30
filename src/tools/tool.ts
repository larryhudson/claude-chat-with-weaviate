import { db } from '@/lib/db'
import { WeaviateClient } from 'weaviate-client';

export abstract class ClaudeWeaverTool<P, R> {
    public async execute(params: P): Promise<R>
    {
        throw new Error(`Define execute() method in ${(this.constructor as any).name}`)
    }

    protected async getDb(): Promise<WeaviateClient>
    {
        return db.connect();
    }
}