import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { getUploadsDir, ensureUploadsDir } from '../services/storage';

const router = Router();

const MAX_VIDEO_SIZE = 256 * 1024 * 1024 * 1024; // 256GB
const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB

function createVideoStorage() {
  ensureUploadsDir();
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, getUploadsDir()),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

const videoUpload = multer({
  storage: createVideoStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

const thumbnailUpload = multer({
  storage: createVideoStorage(),
  limits: { fileSize: MAX_THUMBNAIL_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/upload', requireAuth, videoUpload.single('video'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No video file provided' });
      return;
    }

    const mediaFile = await prisma.mediaFile.create({
      data: {
        filename: req.file.originalname,
        filePath: req.file.path,
        fileSize: BigInt(req.file.size),
        mimeType: req.file.mimetype,
      },
    });

    res.status(201).json({
      ...mediaFile,
      fileSize: mediaFile.fileSize.toString(),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/:id/thumbnail', requireAuth, thumbnailUpload.single('thumbnail'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No thumbnail file provided' });
      return;
    }

    const mediaFile = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
    if (!mediaFile) {
      res.status(404).json({ error: 'Media file not found' });
      return;
    }

    res.json({ thumbnailPath: req.file.path, thumbnailFilename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const files = await prisma.mediaFile.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(files.map((f) => ({ ...f, fileSize: f.fileSize.toString() })));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const mediaFile = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
    if (!mediaFile) {
      res.status(404).json({ error: 'Media file not found' });
      return;
    }

    if (fs.existsSync(mediaFile.filePath)) {
      fs.unlinkSync(mediaFile.filePath);
    }

    await prisma.mediaFile.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
