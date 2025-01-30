import { Item } from "@radix-ui/react-accordion";
import { ClaudeWeaverTool } from "../tool"
import { Octokit } from "@octokit/rest";

interface GithubRepoFilesParams {
    repo: string;   
    path?: string;  
    branch?: string;
    include_content?: boolean;
}

interface GithubFile {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size?: number;
    content?: string;
    sha: string;
    url: string;
    html_url: string;
}

interface GithubRepoFilesResponse {
    files: GithubFile[];
    success: boolean;
    error?: string;
}

export default class GithubRepoFiles extends ClaudeWeaverTool<GithubRepoFilesParams, GithubRepoFilesResponse> {
    private octokit: Octokit;

    constructor(toolName: string) {
        super(toolName);
        if (!process.env.GITHUB_TOKEN) {
            throw new Error("GITHUB_TOKEN environment variable is required");
        }
        this.octokit = new Octokit({ 
            auth: process.env.GITHUB_TOKEN
        });
    }

    private async getFileContent(owner: string, repo: string, filePath: string): Promise<string | null> {
        try {
            // First try to get the file content directly
            const response = await this.octokit.repos.getContent({
                owner,
                repo,
                path: filePath
            });

            if ('content' in response.data) {
                return Buffer.from(response.data.content, 'base64').toString('utf-8');
            }

            // If no content in response, try to get it via blob
            if ('sha' in response.data) {
                const blob = await this.octokit.git.getBlob({
                    owner,
                    repo,
                    file_sha: response.data.sha
                });
                return Buffer.from(blob.data.content, 'base64').toString('utf-8');
            }

            return null;
        } catch (error) {
            console.error(`Failed to get content for ${filePath}:`, error);
            return null;
        }
    }

    async execute({ repo, path = '', include_content = true }: GithubRepoFilesParams): Promise<GithubRepoFilesResponse> {
        try {
            const [owner, repository] = repo.split('/');
            
            if (!owner || !repository) {
                throw new Error('Repository must be in format "owner/repo"');
            }

            const response = await this.octokit.repos.getContent({
                owner,
                repo: repository,
                path
            });

            const contents = Array.isArray(response.data) ? response.data : [response.data];
            const files: GithubFile[] = [];

            for (const item of contents) {
                const fileInfo: GithubFile = {
                    name: item.name,
                    path: item.path,
                    type: item.type as 'file' | 'dir',
                    size: item.size,
                    sha: item.sha,
                    url: item.url,
                    html_url: item.html_url as string,
                    content: undefined
                };

                if (include_content && item.type === 'file') {
                    fileInfo.content = await this.getFileContent(owner, repository, item.path) || undefined;
                }

                files.push(fileInfo);
            }

            return {
                files,
                success: true
            };

        } catch (error) {
            return {
                files: [],
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async getAllFilesInDirectory(owner: string, repo: string, path: string = '', includeContent: boolean = false): Promise<GithubFile[]> {
        try {
            const response = await this.octokit.repos.getContent({
                owner,
                repo,
                path
            });

            const contents = Array.isArray(response.data) ? response.data : [response.data];
            let allFiles: GithubFile[] = [];

            for (const item of contents) {
                if (item.type === 'dir') {
                    // Recursively get files from subdirectory
                    const subFiles = await this.getAllFilesInDirectory(owner, repo, item.path, includeContent);
                    allFiles = [...allFiles, ...subFiles];
                } else {
                    const fileInfo: GithubFile = {
                        name: item.name,
                        path: item.path,
                        type: item.type as 'file' | 'dir',
                        size: item.size,
                        sha: item.sha,
                        url: item.url,
                        html_url: item.html_url as string,
                        content: undefined
                    };

                    if (includeContent) {
                        fileInfo.content = await this.getFileContent(owner, repo, item.path) || undefined;
                    }

                    allFiles.push(fileInfo);
                }
            }

            return allFiles;
        } catch (error) {
            console.error(`Failed to get files for ${path}:`, error);
            return [];
        }
    }
}