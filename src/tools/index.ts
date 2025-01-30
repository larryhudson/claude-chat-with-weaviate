import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ClaudeWeaverTool } from "./_tool";

export const toolDefinitions: () => Tool[] = () => {
  const __filename = fileURLToPath(import.meta.url);  
  return readdirSync(path.dirname(__filename))
    .filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(readFileSync(path.join(path.dirname(__filename), file), 'utf-8')))
};

export const toolHandler = async (toolName: string) => {
  const __filename = fileURLToPath(import.meta.url);  
  
  if(!toolDefinitions().map(((item: Tool) => item.name)).includes(toolName)){    
    const tool: ClaudeWeaverTool = (await import(path.resolve(path.dirname(__filename), `_${toolName}`))).default;

    console.log({tool})
  }
}
