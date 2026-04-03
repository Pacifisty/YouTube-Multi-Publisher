import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

const SetupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/setup', async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      res.status(400).json({ error: 'Admin user already exists' });
      return;
    }

    const body = SetupSchema.parse(req.body);
    const hashed = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({ data: { email: body.email, password: hashed } });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
