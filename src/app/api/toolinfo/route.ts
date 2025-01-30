import { NextResponse } from 'next/server';
import { toolDefinitions } from '@/tools';

export async function GET() {
    try {
        const tools = toolDefinitions();
        return NextResponse.json({ tools, success: true });
    } catch (error: Error | any) {
        console.error('Error fetching tools:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}