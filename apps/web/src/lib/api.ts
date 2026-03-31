const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

async function uploadFile(path: string, formData: FormData): Promise<unknown> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Upload failed');
  }

  return res.json();
}

export interface User {
  id: string;
  email: string;
}

export interface YoutubeAccount {
  id: string;
  googleId: string;
  email: string;
  displayName: string;
  expiresAt: string;
  channels: YoutubeChannel[];
}

export interface YoutubeChannel {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  accountId: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  filePath: string;
  fileSize: string;
  mimeType: string;
  duration?: number;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  mediaFileId: string;
  mediaFile: MediaFile;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  targets: CampaignTarget[];
}

export interface CampaignTarget {
  id: string;
  campaignId: string;
  channelId: string;
  channel?: YoutubeChannel & { account?: YoutubeAccount };
  title: string;
  description: string;
  tags: string[];
  privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  publishAt?: string;
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  youtubeVideoId?: string;
  errorMessage?: string;
  retries: number;
  logs?: JobLog[];
}

export interface JobLog {
  id: string;
  targetId: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  createdAt: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    setup: (email: string, password: string) =>
      request<{ token: string; user: User }>('/api/auth/setup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },
  accounts: {
    list: () => request<YoutubeAccount[]>('/api/accounts'),
    delete: (id: string) => request<{ success: boolean }>(`/api/accounts/${id}`, { method: 'DELETE' }),
    getOAuthUrl: () => request<{ url: string }>('/api/accounts/oauth/url'),
  },
  media: {
    list: () => request<MediaFile[]>('/api/media'),
    upload: (formData: FormData) => uploadFile('/api/media/upload', formData) as Promise<MediaFile>,
    delete: (id: string) => request<{ success: boolean }>(`/api/media/${id}`, { method: 'DELETE' }),
  },
  campaigns: {
    list: () => request<Campaign[]>('/api/campaigns'),
    get: (id: string) => request<Campaign>(`/api/campaigns/${id}`),
    create: (data: {
      title: string;
      description?: string;
      mediaFileId: string;
      targets: Array<{
        channelId: string;
        title: string;
        description: string;
        tags: string[];
        privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
        publishAt?: string;
        thumbnailPath?: string;
        playlistId?: string;
      }>;
    }) => request<Campaign>('/api/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    publish: (id: string) =>
      request<{ success: boolean; enqueuedJobs: number }>(`/api/campaigns/${id}/publish`, { method: 'POST' }),
    delete: (id: string) => request<{ success: boolean }>(`/api/campaigns/${id}`, { method: 'DELETE' }),
  },
  jobs: {
    list: () => request<CampaignTarget[]>('/api/jobs'),
    getLogs: (targetId: string) => request<JobLog[]>(`/api/jobs/${targetId}/logs`),
    retry: (targetId: string) => request<{ success: boolean; jobId: string }>(`/api/jobs/${targetId}/retry`, { method: 'POST' }),
  },
};
