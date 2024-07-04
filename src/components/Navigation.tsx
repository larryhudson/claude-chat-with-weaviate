"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const Navigation = () => {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Chat' },
        { href: '/notes', label: 'Notes' },
    ];

    const externalLinks = [
        { href: 'https://github.com/larryhudson/claude-chat-with-weaviate', label: 'GitHub repo' }
    ]

    return (
        <div className="bg-gray-100">
            <nav className="container max-w-3xl mx-auto flex justify-between space-x-4 p-4 rounded-lg">
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
                            {item.label}
                        </Link>
                    ))}
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
    );
};

export default Navigation;
