import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { getAuthUrl, exchangeCode, buildAuthClient } from '../services/oauth';
import { listChannels } from '../services/youtube';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await prisma.youtubeAccount.findMany({
      include: { channels: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(accounts);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.youtubeAccount.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/oauth/url', requireAuth, (_req: Request, res: Response): void => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch {
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
});

router.get('/oauth/callback', async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  try {
    const tokenData = await exchangeCode(code);
    const authClient = buildAuthClient(tokenData.accessToken, tokenData.refreshToken);
    const channels = await listChannels(authClient);

    const account = await prisma.youtubeAccount.upsert({
      where: { googleId: tokenData.googleId },
      update: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        email: tokenData.email,
        displayName: tokenData.displayName,
      },
      create: {
        googleId: tokenData.googleId,
        email: tokenData.email,
        displayName: tokenData.displayName,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
      },
    });

    for (const channel of channels) {
      await prisma.youtubeChannel.upsert({
        where: { channelId: channel.channelId },
        update: {
          title: channel.title,
          description: channel.description,
          thumbnail: channel.thumbnail,
        },
        create: {
          channelId: channel.channelId,
          title: channel.title,
          description: channel.description,
          thumbnail: channel.thumbnail,
          accountId: account.id,
        },
      });
    }

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    res.redirect(`${webUrl}/accounts?connected=true`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    res.redirect(`${webUrl}/accounts?error=oauth_failed`);
  }
});

export default router;
