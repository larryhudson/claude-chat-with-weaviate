import { db } from '@/lib/db'
import { WeaviateClient } from 'weaviate-client';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { Tool } from '@anthropic-ai/sdk/resources/messages.mjs';

const __filename = fileURLToPath(import.meta.url);  

export abstract class ClaudeWeaverTool<P, R> {
    
    constructor(protected toolName: string){}
    
    public async execute(params: P): Promise<R>
    {
        throw new Error(`Define execute() method in ${(this.constructor as any).name}`)
    }

    public getApi(): Tool
    {
        const toolDir = path.join(path.dirname(__filename), this.toolName);
        const apiPath = path.resolve(toolDir, 'api.json');

        if(!fs.existsSync(apiPath)){
            throw new Error(`No api.json defined in "${toolDir}"`);
        }

        return {name: this.toolName, ...JSON.parse(fs.readFileSync(apiPath, 'utf-8'))};        
    }

    protected async getDb(): Promise<WeaviateClient>
    {    
        return db.connect();
    }
}