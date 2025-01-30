import { ClaudeWeaverTool } from "../tool"
import { YoutubeTranscript } from 'youtube-transcript';

interface ExtractYouTubeTranscriptionToolParams {
    videoUrl: string;
}

interface ExtractYouTubeTranscriptionToolResponse {
    transcript?: string;
    error?: string;
}

export function formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default class ExtractYouTubeTranscriptionTool extends ClaudeWeaverTool<ExtractYouTubeTranscriptionToolParams, ExtractYouTubeTranscriptionToolResponse> {
    async execute({ videoUrl }: ExtractYouTubeTranscriptionToolParams): Promise<ExtractYouTubeTranscriptionToolResponse>
    {
        try {
            const videoId = videoUrl.split('v=')[1];
            if (!videoId) {
              throw new Error('Invalid YouTube URL');
            }
        
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
            const formattedTranscript = transcript.map(entry => {
              return `[${formatTime(entry.offset)}] ${entry.text}`;
            }).join('\n');
        
            return { transcript: formattedTranscript };
          } catch (error) {
            console.error('Error extracting YouTube transcript:', error);
            return { error: 'Failed to extract transcript. Please check the URL and try again.' };
          }
    }
}