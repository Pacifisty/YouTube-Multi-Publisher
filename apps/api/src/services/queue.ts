import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const uploadQueue = new Queue('youtube-uploads', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const uploadQueueEvents = new QueueEvents('youtube-uploads', {
  connection: redisConnection,
});

export interface UploadJobData {
  targetId: string;
  campaignId: string;
}

export async function enqueueUpload(data: UploadJobData): Promise<string> {
  const job = await uploadQueue.add('upload', data, {
    jobId: `upload-${data.targetId}`,
  });
  return job.id || '';
}
