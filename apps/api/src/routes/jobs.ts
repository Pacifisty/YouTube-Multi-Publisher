import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { enqueueUpload } from '../services/queue';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const targets = await prisma.campaignTarget.findMany({
      include: {
        campaign: { select: { id: true, title: true } },
        channel: { select: { title: true, channelId: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(targets);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:targetId/logs', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.jobLog.findMany({
      where: { targetId: req.params.targetId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:targetId/retry', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const target = await prisma.campaignTarget.findUnique({
      where: { id: req.params.targetId },
    });

    if (!target) {
      res.status(404).json({ error: 'Job target not found' });
      return;
    }

    if (target.status !== 'FAILED') {
      res.status(400).json({ error: 'Only failed jobs can be retried' });
      return;
    }

    await prisma.campaignTarget.update({
      where: { id: target.id },
      data: {
        status: 'PENDING',
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
      },
    });

    await prisma.jobLog.create({
      data: { targetId: target.id, level: 'INFO', message: 'Job manually retried' },
    });

    const jobId = await enqueueUpload({ targetId: target.id, campaignId: target.campaignId });
    res.json({ success: true, jobId });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
