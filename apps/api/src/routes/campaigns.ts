import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { enqueueUpload } from '../services/queue';

const router = Router();

type CampaignWithMedia = {
  mediaFile: { fileSize: bigint; [key: string]: unknown };
  [key: string]: unknown;
};

const TargetSchema = z.object({
  channelId: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(5000),
  tags: z.array(z.string()).default([]),
  privacy: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PUBLIC'),
  publishAt: z.string().datetime().optional(),
  thumbnailPath: z.string().optional(),
  playlistId: z.string().optional(),
});

const CreateCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  mediaFileId: z.string(),
  targets: z.array(TargetSchema).min(1),
});

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        mediaFile: true,
        targets: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns.map((c: CampaignWithMedia) => ({
      ...c,
      mediaFile: { ...c.mediaFile, fileSize: c.mediaFile.fileSize.toString() },
    })));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = CreateCampaignSchema.parse(req.body);

    const mediaFile = await prisma.mediaFile.findUnique({ where: { id: body.mediaFileId } });
    if (!mediaFile) {
      res.status(404).json({ error: 'Media file not found' });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        title: body.title,
        description: body.description,
        mediaFileId: body.mediaFileId,
        targets: {
          create: body.targets.map((t) => ({
            channelId: t.channelId,
            title: t.title,
            description: t.description,
            tags: t.tags,
            privacy: t.privacy,
            publishAt: t.publishAt ? new Date(t.publishAt) : null,
            thumbnailPath: t.thumbnailPath,
            playlistId: t.playlistId,
          })),
        },
      },
      include: { targets: true, mediaFile: true },
    });

    res.status(201).json({
      ...campaign,
      mediaFile: { ...campaign.mediaFile, fileSize: campaign.mediaFile.fileSize.toString() },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        mediaFile: true,
        targets: {
          include: {
            channel: { include: { account: true } },
            logs: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json({
      ...campaign,
      mediaFile: { ...campaign.mediaFile, fileSize: campaign.mediaFile.fileSize.toString() },
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/publish', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { targets: true },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const pendingTargets = campaign.targets.filter((t: { status: string }) => t.status === 'PENDING');
    if (pendingTargets.length === 0) {
      res.status(400).json({ error: 'No pending targets to publish' });
      return;
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'RUNNING' },
    });

    const jobIds = await Promise.all(
      pendingTargets.map((target: { id: string }) =>
        enqueueUpload({ targetId: target.id, campaignId: campaign.id })
      )
    );

    res.json({ success: true, enqueuedJobs: jobIds.length });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
