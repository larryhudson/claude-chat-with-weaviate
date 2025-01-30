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

type ClaudeWeaverToolConstructor = new () => ClaudeWeaverTool<any, any>;

export const toolHandler = async (toolName: string): Promise<ClaudeWeaverTool<any,any> | null>  => {  
  if(toolDefinitions().map(((item: Tool) => item.name)).includes(toolName)){    
    const TheTool: ClaudeWeaverToolConstructor = (await import(`@/tools/_${toolName}`)).default;    
    return new TheTool();
  }
  
  return null;
}
