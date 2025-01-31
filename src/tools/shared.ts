export function getNormalizedToolName(structuredToolName: string, ucFirst: boolean = false): string
{
    const toolName = structuredToolName.replace(/_/g, ' ');

    if(ucFirst){
        return toolName.charAt(0).toUpperCase() + toolName.slice(1);
    }    

    return toolName;
}