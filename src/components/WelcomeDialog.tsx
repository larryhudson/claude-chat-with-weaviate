import React, { MouseEventHandler, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import { Code, Play } from "lucide-react";
import { Tool } from '@anthropic-ai/sdk/resources/messages.mjs';

const WelcomeDialog = ({ isOpen, onClose } : { isOpen: boolean,onClose: (event: any) => void }) => {
    const [tools, setTools] =  useState<Tool[]>([]);

    const fetchTools = async () => {
        try {
          
            const response = await fetch('/api/toolinfo');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch tools');
            }

            setTools(data.tools);
        } catch (err: any) {
          
            console.error('Error fetching tools:', err);
        }

    
    };

    useEffect(() => {
        fetchTools();
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='scrollable'>
                <DialogHeader>
                    <DialogTitle>Welcome to ClaudeWeaver!</DialogTitle>
                    <DialogDescription>
                        This is a chatbot app using <a className="underline" href="https://www.anthropic.com/news/claude-3-5-sonnet">Claude 3.5 Sonnet</a> and <a className="underline" href="https://weaviate.io/">Weaviate</a>.
                    </DialogDescription>
                </DialogHeader>
                <div className="prose">
                    <p>Here are some things you can do:</p>
                    <ul>
                        <li>Ask Claude to save notes for future reference. These are saved in the Weaviate vector database.</li>
                        <li>Once there are some notes in the database, ask Claude to do stuff with them.</li>
                        <li>View, edit and delete notes manually in the Notes section.</li>
                    </ul>
                </div>

                <strong>Available tools:</strong>

                <ul className='tools-list prose'>
                    {tools.map((tool, index) => {
                        const toolName = tool.name.replace(/_/g, ' ');
                        return (<li key={index}>
                            <h4>{toolName.charAt(0).toUpperCase() + toolName.slice(1)}</h4>
                            <p>{tool.description}</p>
                        </li>)
                    })}
                </ul>

                <DialogFooter>
                    <div className="w-full flex justify-between items-stretch">
                        <Link href="https://youtu.be/3EqjKtwCM_E" target="_blank" passHref>
                            <Button className="flex justify-center gap-2">
                                <Play />
                                Demo video
                            </Button>
                        </Link>

                        <Link href="https://github.com/larryhudson/claude-chat-with-weaviate" target="_blank" passHref>
                            <Button className="flex justify-center gap-2">
                                <Code />
                                Source code
                            </Button>
                        </Link>

                        <Button onClick={onClose}>Get Started</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WelcomeDialog;
