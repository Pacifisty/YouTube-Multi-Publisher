import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import mediaRouter from './routes/media';
import campaignsRouter from './routes/campaigns';
import jobsRouter from './routes/jobs';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/jobs', jobsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
