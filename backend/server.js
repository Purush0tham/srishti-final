import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import analyzeRouter from './routes/analyze.js';
import { connectDB } from './config/db.js';
import { PORT } from './config/env.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/analyze', analyzeRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CareGuard AI',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CareGuard AI Backend running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
