"use client";
import React, { useState, useEffect, useRef, MouseEventHandler } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";
import { Textarea } from '@/components/ui/textarea';
import WelcomeDialog from '@/components/WelcomeDialog';
import { Settings, CheckCircle, ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs';

const ErrorAlert = ({ message } : { message: string }) => (
    <Alert variant="destructive" className="mt-4 border-red-600 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-red-800">Error</AlertTitle>
        <AlertDescription className="text-red-700">
            {message}
        </AlertDescription>
    </Alert>
);

const ToolSection = ({ icon: Icon, title, content } : { icon: any, title: string, content: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);

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
                    <pre className="whitespace-pre-wrap">
                        {JSON.stringify(content, null, 2)}
                    </pre>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

type ChatContentType = { name?: string, input?: string, content?: string, type: string, text: string };
type ChatMessageProps = { message: { role: string, content: ChatContentType[] }, isLoading: boolean, showDeleteButton: boolean, onDeleteMessage?: MouseEventHandler<any> | undefined};

const ChatMessage = ({ message, isLoading = false, showDeleteButton = false, onDeleteMessage = undefined } : ChatMessageProps) => {
    const { role, content } = message;
    const isUser = role === "user";

    return (
        <Card className={`mb-4 ${isUser ? 'ml-auto bg-blue-100' : 'mr-auto'} max-w-[75%] shadow-lg`}>
            <CardContent className="p-4 space-y-4">
                {message.content.map((contentBlock: ChatContentType, index) => (
                    contentBlock.type === 'tool_use' ? (
                        <ToolSection
                            key={index}
                            icon={Settings}
                            title={`Using tool: ${contentBlock.name}`}
                            content={contentBlock.input as string}
                        />
                    ) : contentBlock.type === 'tool_result' ? (
                        <ToolSection
                            key={index}
                            icon={CheckCircle}
                            title="Tool result"
                            content={contentBlock.content as string}
                        />
                    ) : (
                        <Markdown key={index} className="prose">
                            {contentBlock.text}
                        </Markdown>
                    )
                ))
                }
                {isLoading && (
                    <div className="text-right">
                        <LoaderCircle className="animate-spin" /> Loading...
                    </div>
                )}
                {showDeleteButton && (
                    <Button variant="destructive" onClick={onDeleteMessage}>
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
    const [error, setError] = useState(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

    // Show welcome dialog if there are no notes, and the dialog has not been seen before.
    useEffect(() => {
        const hasShownWelcomeDialog = localStorage.getItem('has-seen-welcome-dialog') === 'true';
        if (initialNotesCount === 0 && !hasShownWelcomeDialog) {
            setIsWelcomeModalOpen(true);
        }
    }, [initialNotesCount]);

    const handleCloseWelcomeDialog = () => {
        setIsWelcomeModalOpen(false);
        localStorage.setItem('has-seen-welcome-dialog', 'true');
    };

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
            <WelcomeDialog
                isOpen={isWelcomeModalOpen}
                onClose={handleCloseWelcomeDialog}
            />
            <Card className="bg-gray-100 w-full h-full flex flex-col mx-auto">
                <CardContent className="flex-grow">
                    <div className="h-[75vh] p-4 overflow-auto">
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
                    <form onSubmit={(e) => { e.preventDefault(); sendNewMessage(); }} className="flex w-full space-x-2">
                        <Textarea
                            placeholder="Type a message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading}>
                            Send
                        </Button>
                        {error && (
                            <Button type="button" onClick={() => sendMessages(messages)} >
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
