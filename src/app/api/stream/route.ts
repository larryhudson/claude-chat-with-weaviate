import { NextRequest, NextResponse } from 'next/server';
import Anthropic from "@anthropic-ai/sdk";
import { toolDefinitions, toolHandlers } from '@/lib/tools';

const anthropic = new Anthropic();

const systemPrompt = `You are a helpful assistant with access to tools that give you extra capabilities. When asked a question that is outside of your training data, use the search_notes tool to find relevant information, including personal information about the user.`

async function processMessages(initialMessages, controller) {

    console.log({ initialMessages });

    const newMessages = [];

    let stopReason;
    do {

        const messagesToSend = [...initialMessages, newMessages];
        console.log(JSON.stringify({ messagesToSend }, null, 2));

        const messageStream = anthropic.messages.stream({
            messages: [...initialMessages, ...newMessages],
            max_tokens: 4096,
            model: 'claude-3-5-sonnet-20240620',
            tools: toolDefinitions,
            system: systemPrompt
        });

        const sendEventToBrowser = (type: string, data: any) => {
            controller.enqueue(`data: ${JSON.stringify({ type, data })}\n\n`);
        };

        for await (const chunk of messageStream) {
            if (chunk.type === 'content_block_start' || chunk.type === 'content_block_delta') {
                sendEventToBrowser('streaming_message', chunk.delta?.text || '');
            }
        }

        const claudeResponse = await messageStream.finalMessage();

        console.log("Usage from Claude response", claudeResponse.usage)

        const assistantMessage = {
            role: 'assistant',
            content: claudeResponse.content
        };

        newMessages.push(assistantMessage);
        sendEventToBrowser('full_message', assistantMessage);

        stopReason = claudeResponse.stop_reason;
        if (stopReason === 'tool_use') {
            const toolUseContentBlocks = claudeResponse.content.filter(block => block.type === "tool_use");

            if (toolUseContentBlocks.length === 0) {
                throw new Error("No tool_use content block found in message");
            }

            const toolResultContentBlocks = [];
            for (const toolUseContentBlock of toolUseContentBlocks) {
                const toolName = toolUseContentBlock.name;
                const toolHandler = toolHandlers[toolName];
                if (!toolHandler) {
                    throw new Error(`No handler found for tool ${toolName}`);
                }

                try {
                    const toolOutput = await toolHandler(toolUseContentBlock.input);
                    toolResultContentBlocks.push({
                        type: 'tool_result',
                        tool_use_id: toolUseContentBlock.id,
                        content: JSON.stringify(toolOutput)
                    });
                } catch (error) {
                    console.error(`Error executing tool ${toolName}:`, error);
                    toolResultContentBlocks.push({
                        type: 'tool_result',
                        tool_use_id: toolUseContentBlock.id,
                        content: JSON.stringify({ error: `Error executing tool ${toolName}: ${error.message}` })
                    });
                }
            }

            const toolResultMessage = {
                role: 'user',
                content: toolResultContentBlocks
            };
            newMessages.push(toolResultMessage);
            sendEventToBrowser('full_message', toolResultMessage);
        }
    } while (stopReason === "tool_use");
}

export async function POST(req: NextRequest) {
    const requestJson = await req.json();
    let messages = requestJson.messages;

    const stream = new ReadableStream({
        async start(controller) {

            try {
                await processMessages(messages, controller);
                controller.close();
            } catch (error) {
                console.error('Error in stream:', error);
                controller.enqueue(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
