"use client";
import React, { useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ToolSection = ({ icon: Icon, title, content } : { icon: any, title: string, content: any }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [toolCode, setToolCode] = React.useState<string | null>(JSON.stringify({
        error: 'No input'
    }, null, 2));

    useEffect(() => {
        let code: string = content;
        if(content){
            try {           
                const parsed = JSON.parse(content);     
                code = JSON.stringify(parsed, null, 2);
            } catch(e: Error | any){
                try {                        
                    code = JSON.stringify(content, null, 2);
                } catch(e: Error | any){
                    console.error('cant stringify', content);
                    code = JSON.stringify({
                        error: 'Input conversion error'
                    }, null, 2);
                }
            }

            setToolCode(code);
        }
    }, [content]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
            <div className="flex items-center justify-between p-2 bg-gray-100 rounded-t-md">
                <div className="flex items-center text-gray-600">
                    <Icon className="mr-2" size={16} />
                    <strong>{title}</strong>
                </div>
                <CollapsibleTrigger asChild>
                    <button className="hover:bg-gray-200 p-1 rounded">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="p-2 bg-white border border-t-0 border-gray-200 rounded-b-md">
                <div className="prose">
                <SyntaxHighlighter 
                    language="json"
                    style={vs}
                    customStyle={{ margin: 0 }}
                >
                    {toolCode || []}
                </SyntaxHighlighter>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default ToolSection;