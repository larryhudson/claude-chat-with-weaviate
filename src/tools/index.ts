import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export const toolDefinitions: () => Tool[] = () => {
  const __filename = fileURLToPath(import.meta.url);  
  return readdirSync(dirname(__filename))
    .filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(readFileSync(join(dirname(__filename), file), 'utf-8')))
};