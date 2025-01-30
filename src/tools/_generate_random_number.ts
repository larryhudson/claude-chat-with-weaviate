import { ClaudeWeaverTool } from "./_tool"

export interface GenerateRandomNumberToolParams { 
    min: number; 
    max: number 
}

export default class GenerateRandomNumberTool extends ClaudeWeaverTool<GenerateRandomNumberToolParams, number> {
    async execute({ min, max } : GenerateRandomNumberToolParams): Promise<number>
    {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}