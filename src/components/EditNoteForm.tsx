"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

import { updateNote } from "@/actions";

const formSchema = z.object({
    content: z.string().min(1, "Content is required"),
    context: z.string().min(1, "Context is required"),
})

export default function EditNoteForm({ noteId, initialData }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: initialData.content,
            context: initialData.context,
        },
    });

    async function onSubmit(values) {
        setIsLoading(true);

        try {
            console.log({ noteId, values });
            await updateNote(noteId, values);
            router.push('/notes');
        } catch (error) {
            console.error('Failed to update note:', error);
            // Handle error (e.g., show error message to user)
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Edit Note</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                    <Textarea {...field} rows={10} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="context"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Context</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Note'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
