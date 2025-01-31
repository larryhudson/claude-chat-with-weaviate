"use client";
import React, { NamedExoticComponent, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { HelpCircle, MessageSquareText, NotebookIcon } from 'lucide-react';
import { Button } from './ui/button';
import WelcomeDialog from './WelcomeDialog';
import { Tool } from '@anthropic-ai/sdk/resources/messages.mjs';

type AppLink = {
    href: string, 
    label: string, 
    icon?: any
}

const Navigation = () => {
    const pathname = usePathname();

    const navItems: AppLink[] = [
        { href: '/', label: 'Chat', icon: MessageSquareText },
        { href: '/notes', label: 'Notes', icon: NotebookIcon },
    ];

    const externalLinks: AppLink[] = [
        { href: 'https://github.com/larryhudson/claude-chat-with-weaviate', label: 'GitHub repo' }
    ]

     const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);    

    const handleCloseWelcomeDialog = () => {
        setIsWelcomeModalOpen(false);
        localStorage.setItem('has-seen-welcome-dialog', 'true');
    };

    useEffect(() => {

    }, []);

    return (<>
        <WelcomeDialog
            isOpen={isWelcomeModalOpen}
            onClose={handleCloseWelcomeDialog}
        />
        <div className="bg-gray-100">
            <nav className="container max-w-3xl mx-auto flex space-x-4 p-4 rounded-lg">
                <nav className="flex space-x-4 p-4 rounded-lg">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "px-3 py-2 rounded-md text-sm font-medium",
                                pathname === item.href
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {item.icon && <item.icon className={'inline-block w-5 h-5 mr-2'} />}
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <nav className="flex space-x-4 p-4 rounded-lg">
                    <Button type="button" className='mb-3' onClick={() => setIsWelcomeModalOpen(true)}>
                        <HelpCircle className='mr-1'></HelpCircle>Info
                    </Button>
                </nav>
                <nav className="flex space-x-4 p-4 rounded-lg">
                    {externalLinks.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            {item.label} &#8599;
                        </Link>
                    ))}
                </nav>
            </nav>
        </div>
        </>
    );
};

export default Navigation;
