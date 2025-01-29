import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

export const toolDefinitions: Tool[] = readdirSync(dirname(__filename))
  .filter(file => file.endsWith('.json'))
  .map(file => JSON.parse(readFileSync(join(dirname(__filename), file), 'utf-8')));