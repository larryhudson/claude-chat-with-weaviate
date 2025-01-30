import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ClaudeWeaverTool } from "./tool";

export const toolDefinitions: () => Tool[] = () => {
  const __filename = fileURLToPath(import.meta.url);  
  const toolsDir = path.dirname(__filename);

  const tools: Tool[] = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => JSON.parse(
        fs.readFileSync(
          path.join(toolsDir, dirent.name, `api.json`), 
          'utf-8'
        )
    ));

  return tools;
};

type ClaudeWeaverToolConstructor = new () => ClaudeWeaverTool<any, any>;

export const toolHandler = async (toolName: string): Promise<ClaudeWeaverTool<any,any> | null>  => {  
  if(toolDefinitions().map(((item: Tool) => item.name)).includes(toolName)){    
    const TheTool: ClaudeWeaverToolConstructor = (await import(`@/tools/${toolName}/tool.ts`)).default;
    return new TheTool();
  }
  
  return null;
}
