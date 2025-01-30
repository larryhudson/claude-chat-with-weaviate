import { Tool } from "@anthropic-ai/sdk/resources/messages.mjs";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ClaudeWeaverTool } from "./tool";

type InstancedToolDef = Tool & { _tool?: ClaudeWeaverTool<any, any> };
type ClaudeWeaverToolConstructor = new (toolName: string) => ClaudeWeaverTool<any, any>;

export const toolDefinitions: (instanced?: boolean) => Promise<InstancedToolDef[]> = 
  async (instanced = false) => {
    const __filename = fileURLToPath(import.meta.url);  
    const toolsDir = path.dirname(__filename);

    const dirents = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

    const tools: InstancedToolDef[] = await Promise.all(
      dirents.map(async (dirent) => {
        const tool = await makeTool(dirent.name);  
        if(instanced){    
          return {_tool: tool, ...tool.getApi()};
        }

        return tool.getApi();
      })
    );

    return tools;
  }
;

const makeTool = async (toolName: string): Promise<ClaudeWeaverTool<any,any>> => {
  const TheTool: ClaudeWeaverToolConstructor = (await import(`@/tools/${toolName}/tool.ts`)).default;
  return new TheTool(toolName);
}

export const toolHandler = async (toolName: string): Promise<ClaudeWeaverTool<any,any> | null>  => {  
  const toolDef: InstancedToolDef  | null = (await toolDefinitions(true)).find((item: Tool) => item.name === toolName) || null;

  if(toolDef && toolDef._tool){      
    return toolDef._tool;
  }
  
  return null;
}
