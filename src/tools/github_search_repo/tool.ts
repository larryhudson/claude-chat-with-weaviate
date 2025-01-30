import { ClaudeWeaverTool } from "../tool"

interface GitHubSearchParams {
    query: string;
    type: 'repositories' | 'users';
    branch?: string;
}

interface GitHubRepo {
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    stargazers_count: number;
    forks_count: number;
    language: string;
}

interface GitHubUser {
    login: string;
    html_url: string;
    avatar_url: string;
    name: string;
    bio: string;
    public_repos: number;
    followers: number;
}

type GitHubSearchResult = {
    success: boolean,
    items: GitHubRepo[] | GitHubUser[];
    total_count: number;
    error?: string
}

export default class GitHubSearchTool extends ClaudeWeaverTool<GitHubSearchParams, GitHubSearchResult> {
    async execute({ query, type }: GitHubSearchParams): Promise<GitHubSearchResult> {
        if(!process.env.GITHUB_TOKEN){
            return {
                items: [],
                total_count: 0,
                success: false,
                error: "No GITHUB_TOKEN env var defined in .env.local"
            }
        }

        const endpoint = `https://api.github.com/search/${type}`;
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            items: data.items,
            total_count: data.total_count
        };
    }
}