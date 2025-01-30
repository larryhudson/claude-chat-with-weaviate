import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";

export function NoteCard({ note } : { note: any }) {
    return (
        <Card key={note.id} className="overflow-hidden">
            <CardContent className="pt-6">
                <Markdown className="prose">{note.content}</Markdown>
            </CardContent>
            <CardFooter className="pt-6 bg-gray-50 text-sm text-gray-600 gap-4 flex-col md:flex-row justify-between items-center">
                <div className="flex-1">
                    <span>Context: {note.context}</span>
                </div>
                <div className="flex-1 text-center">
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex-1 flex justify-end space-x-2">
                    <Link href={`/notes/${note.id}/edit`} passHref>
                        <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/notes/${note.id}/delete`} passHref>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">Delete</Button>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
