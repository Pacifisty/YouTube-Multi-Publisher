import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { redisConnection, UploadJobData } from '../services/queue';
import { prisma } from '../prisma';
import { buildAuthClient, refreshAccessToken } from '../services/oauth';
import { uploadVideo, setThumbnail, addToPlaylist } from '../services/youtube';
type Privacy = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';

async function addLog(targetId: string, level: 'INFO' | 'WARN' | 'ERROR', message: string) {
  await prisma.jobLog.create({ data: { targetId, level, message } });
  console.log(`[${level}] [target:${targetId}] ${message}`);
}

async function processUpload(job: Job<UploadJobData>): Promise<void> {
  const { targetId } = job.data;

  const target = await prisma.campaignTarget.findUnique({
    where: { id: targetId },
    include: {
      campaign: { include: { mediaFile: true } },
      channel: { include: { account: true } },
    },
  });

  if (!target) throw new Error(`Target ${targetId} not found`);

  await prisma.campaignTarget.update({
    where: { id: targetId },
    data: { status: 'PROCESSING', startedAt: new Date() },
  });

  await addLog(targetId, 'INFO', `Starting upload to channel: ${target.channel.title}`);

  const account = target.channel.account;
  let { accessToken } = account;
  const { refreshToken } = account;

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (account.expiresAt.getTime() < fiveMinutesFromNow.getTime()) {
    await addLog(targetId, 'INFO', 'Access token expired, refreshing...');
    const refreshed = await refreshAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    await prisma.youtubeAccount.update({
      where: { id: account.id },
      data: { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt },
    });
    await addLog(targetId, 'INFO', 'Token refreshed successfully');
  }

  const authClient = buildAuthClient(accessToken, refreshToken);

  const privacyMap: Record<Privacy, 'public' | 'unlisted' | 'private'> = {
    PUBLIC: 'public',
    UNLISTED: 'unlisted',
    PRIVATE: 'private',
  };

  await addLog(targetId, 'INFO', `Uploading file: ${target.campaign.mediaFile.filename}`);

  const videoId = await uploadVideo({
    authClient,
    filePath: target.campaign.mediaFile.filePath,
    title: target.title,
    description: target.description,
    tags: target.tags,
    privacy: privacyMap[target.privacy as Privacy],
    publishAt: target.publishAt || undefined,
    playlistId: target.playlistId || undefined,
  });

  await addLog(targetId, 'INFO', `Video uploaded successfully. YouTube ID: ${videoId}`);

  if (target.thumbnailPath) {
    try {
      await setThumbnail(authClient, videoId, target.thumbnailPath);
      await addLog(targetId, 'INFO', 'Thumbnail set successfully');
    } catch (err) {
      await addLog(targetId, 'WARN', `Failed to set thumbnail: ${(err as Error).message}`);
    }
  }

  if (target.playlistId) {
    try {
      await addToPlaylist(authClient, videoId, target.playlistId);
      await addLog(targetId, 'INFO', `Added to playlist: ${target.playlistId}`);
    } catch (err) {
      await addLog(targetId, 'WARN', `Failed to add to playlist: ${(err as Error).message}`);
    }
  }

  await prisma.campaignTarget.update({
    where: { id: targetId },
    data: { status: 'PUBLISHED', youtubeVideoId: videoId, finishedAt: new Date() },
  });

  await addLog(targetId, 'INFO', 'Upload completed successfully');

  // Update campaign status if all targets are done
  const allTargets = await prisma.campaignTarget.findMany({ where: { campaignId: target.campaignId } });
  const allDone = allTargets.every((t: { status: string }) => t.status === 'PUBLISHED' || t.status === 'FAILED');
  const anyFailed = allTargets.some((t: { status: string }) => t.status === 'FAILED');

  if (allDone) {
    await prisma.campaign.update({
      where: { id: target.campaignId },
      data: { status: anyFailed ? 'FAILED' : 'COMPLETED' },
    });
  }
}

const worker = new Worker<UploadJobData>(
  'youtube-uploads',
  async (job) => {
    try {
      await processUpload(job);
    } catch (err) {
      const { targetId } = job.data;
      const message = (err as Error).message;

      await prisma.jobLog.create({ data: { targetId, level: 'ERROR', message } });
      await prisma.campaignTarget.update({
        where: { id: targetId },
        data: {
          status: 'FAILED',
          errorMessage: message,
          finishedAt: new Date(),
          retries: { increment: 1 },
        },
      });

      throw err;
    }
  },
  { connection: redisConnection, concurrency: 2 }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed: ${err.message}`));

console.log('Upload worker started');

export default worker;
