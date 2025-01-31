"use client";
import React, { useState, useEffect, useRef, MouseEventHandler, KeyboardEvent } from 'react';
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { Settings, CheckCircle, LoaderCircle, SendIcon } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs';
import ToolSection from './ToolSection';
import { getNormalizedToolName } from '../tools/shared'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ErrorAlert = ({ message } : { message: string }) => (
    <Alert variant="destructive" className="mt-4 border-red-600 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-red-800">Error</AlertTitle>
        <AlertDescription className="text-red-700">
            {message}
        </AlertDescription>
    </Alert>
);



type ChatContentType = { name?: string, input?: string, content?: string, type: string, text: string };
type ChatMessageProps = { message: { role: string, content: ChatContentType[] }, isLoading: boolean, showDeleteButton: boolean, onDeleteMessage?: MouseEventHandler<any> | undefined};

const ChatMessage = ({ message, isLoading = false, showDeleteButton = false, onDeleteMessage = undefined } : ChatMessageProps) => {
    const { role, content } = message;
    const isUser = role === "user";

    useEffect(() => {

    }, []);

    function detectCode(text: string): React.ReactElement<any, any> {
        // Regular expression to match code blocks with language specifier
        const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;
        let i = 0;
    
        // Find all code blocks in the text
        while ((match = codeBlockRegex.exec(text)) !== null) {
            // Add text before the code block
            if (match.index > lastIndex) {
                const textBefore = text.slice(lastIndex, match.index);
                parts.push(<Markdown key={`text-${i}`}>{textBefore}</Markdown>);
            }
    
            // Add the code block
            parts.push(
                <SyntaxHighlighter
                    key={`code-${i}`}
                    language={match[1]}
                    style={oneDark}
                    customStyle={{ margin: 0 }}
                >
                    {match[2].trim()}
                </SyntaxHighlighter>
            );

            console.log(match[1], match[2].trim());
    
            lastIndex = match.index + match[0].length;
            i++;
        }
    
        // Add remaining text after last code block
        if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            parts.push(<Markdown key={`text-${i}`}>{remainingText}</Markdown>);
        }
    
        // Wrap all parts in a div
        return <div key={i} className="prose">{parts}</div>;
    }
    
    return (
        <Card className={`mb-4 ${isUser ? 'ml-auto bg-blue-100' : 'mr-auto'} max-w-[75%] shadow-lg`}>
            <CardContent className="p-4 space-y-4">
                {message.content.map((contentBlock: ChatContentType, index) => (
                    contentBlock.type === 'tool_use' ? (
                    <ToolSection
                        key={index}
                        icon={Settings}
                        title={`Using tool: ${getNormalizedToolName(contentBlock.name || '')}`}
                            content={contentBlock.input as string}
                        />
                    ) : contentBlock.type === 'tool_result' ? (
                        <ToolSection
                            key={index}
                            icon={CheckCircle}
                            title="Tool result"
                            content={contentBlock.content}
                        />
                    ) : (
                        detectCode(contentBlock.text)
                    )
                ))}

                {isLoading && (
                    <div className="text-right">
                        <LoaderCircle className="animate-spin" /> Loading...
                    </div>
                )}
                {showDeleteButton && (
                    <Button variant="destructive" onClick={onDeleteMessage} size="sm">
                        Delete
                    </Button>
                )}
            </CardContent>
        </Card>
    )
};

const ChatComponent = ({ initialNotesCount }: { initialNotesCount: number }) => {
    const [messages, setMessages] = useState<MessageParam[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [streamingContent, setStreamingContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);   

    const sendMessages = async (messages: MessageParam[]) => {
        setError(null);

        try {
            // This handles the server sent events coming from the API route
            const streamResponse = await fetch('/api/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });

            if (!streamResponse.ok) {
                const errorData = await streamResponse.json();
                console.error('Error opening stream:', errorData);
                setError(errorData.message);
                return;
            }

            if(!streamResponse.body){
                return;
            }

            const streamReader = streamResponse.body.getReader();
            const streamDecoder = new TextDecoder();

            while (true) {
                const { done, value } = await streamReader.read();

                if (done) break;

                const decodedChunk = streamDecoder.decode(value);
                const chunkLines = decodedChunk.split('\n\n');

                for (const chunkLine of chunkLines) {
                    if (chunkLine.startsWith('data: ')) {
                        const eventData = JSON.parse(chunkLine.slice(6));
                        handleStreamEvent(eventData);
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
            setStreamingContent('');
        }
    };

    const sendNewMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const newMessage: MessageParam = { role: 'user', content: [{ type: 'text', text: inputMessage }] };
        const newMessages: MessageParam[] = [...messages, newMessage];
        setMessages(newMessages);
        setInputMessage('');
        setIsLoading(true);
        setStreamingContent('');

        sendMessages(newMessages);
    };

    type StreamEvent = {
        type: string;
        data: any
    };

    const handleStreamEvent = (event: StreamEvent) => {
        if (event.type === 'error') {
            console.log('Error in server sent event:');
            console.log(event.data);
            setError(event.data);
        }

        if (event.type === 'streaming_message') {
            setStreamingContent(prev => prev + event.data);
        } else if (event.type === 'full_message') {
            setMessages(prev => [...prev, event.data]);
            setStreamingContent('');
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView();
    }, [messages, streamingContent]);

    const deleteMessageByIndex = (index: number) => {
        const messagesWithoutDeleted = messages.filter((_msg, checkIndex) => {
            return index !== checkIndex
        })

        setMessages(messagesWithoutDeleted);
    }

    return (
        <>      
            <Card className="bg-gray-100 w-[90%] h-full flex flex-col mx-auto">
                <CardContent className="flex-grow">
                    <div className="h-[80vh] p-4 overflow-auto">
                        <div>
                            {messages.map((msg: any, index) => (
                                <ChatMessage isLoading={false} key={index} message={msg} showDeleteButton={!!error} onDeleteMessage={() => deleteMessageByIndex(index)} />
                            ))}
                            {streamingContent && (
                                <ChatMessage showDeleteButton={false} message={{ role: "assistant", content: [{ type: "text", text: streamingContent }] }} isLoading={true} />
                            )}
                            {error && <ErrorAlert message={error} />}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="">
                    <form onKeyDown={(e: KeyboardEvent) => { if(e.key ==  'Enter' && !e.shiftKey){ e.preventDefault(); sendNewMessage(); }}} onSubmit={(e) => { e.preventDefault(); sendNewMessage(); }} className="flex w-full space-x-1">
                        <Textarea
                            placeholder="Type a message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading} size="sm">
                            <SendIcon className='mr-1 h-4 w-4'></SendIcon>Send
                        </Button>
                        {error && (
                            <Button type="button" onClick={() => sendMessages(messages)} size="sm">
                                Try again
                            </Button>
                        )}
                    </form>
                </CardFooter >
            </Card >
        </>
    );
};

export default ChatComponent;
