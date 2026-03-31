import { google } from 'googleapis';
import * as fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

export interface ChannelInfo {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
}

export async function listChannels(authClient: OAuth2Client): Promise<ChannelInfo[]> {
  const youtube = google.youtube({ version: 'v3', auth: authClient });
  const response = await youtube.channels.list({
    part: ['snippet', 'contentDetails'],
    mine: true,
  });

  if (!response.data.items) return [];

  return response.data.items.map((item) => ({
    channelId: item.id || '',
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    thumbnail: item.snippet?.thumbnails?.default?.url || '',
  }));
}

export interface UploadParams {
  authClient: OAuth2Client;
  filePath: string;
  title: string;
  description: string;
  tags: string[];
  privacy: 'public' | 'unlisted' | 'private';
  publishAt?: Date;
  playlistId?: string;
}

export async function uploadVideo(params: UploadParams): Promise<string> {
  const youtube = google.youtube({ version: 'v3', auth: params.authClient });

  const status: { privacyStatus: string; publishAt?: string } = {
    privacyStatus: params.privacy,
  };

  if (params.publishAt) {
    status.privacyStatus = 'private';
    status.publishAt = params.publishAt.toISOString();
  }

  const fileSize = fs.statSync(params.filePath).size;

  const response = await youtube.videos.insert(
    {
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: params.title,
          description: params.description,
          tags: params.tags,
          categoryId: '22',
        },
        status,
      },
      media: {
        mimeType: 'video/*',
        body: fs.createReadStream(params.filePath),
      },
    },
    {
      onUploadProgress: (evt: { bytesRead: number }) => {
        const progress = Math.round((evt.bytesRead / fileSize) * 100);
        console.log(`Upload progress: ${progress}%`);
      },
    }
  );

  if (!response.data.id) {
    throw new Error('YouTube API did not return a video ID');
  }

  return response.data.id;
}

export async function setThumbnail(
  authClient: OAuth2Client,
  videoId: string,
  thumbnailPath: string
): Promise<void> {
  const youtube = google.youtube({ version: 'v3', auth: authClient });
  await youtube.thumbnails.set({
    videoId,
    media: {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(thumbnailPath),
    },
  });
}

export async function addToPlaylist(
  authClient: OAuth2Client,
  videoId: string,
  playlistId: string
): Promise<void> {
  const youtube = google.youtube({ version: 'v3', auth: authClient });
  await youtube.playlistItems.insert({
    part: ['snippet'],
    requestBody: {
      snippet: {
        playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId,
        },
      },
    },
  });
}
