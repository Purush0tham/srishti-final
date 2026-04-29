import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import analyzeRouter from './routes/analyze.js';
import { getCareSummary } from './controllers/analyzeController.js';
import { connectDB } from './config/db.js';
import { PORT } from './config/env.js';

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/analyze', analyzeRouter);
app.get('/api/summary', getCareSummary);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CareGuard AI',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Global error handler for unhandled route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`\n🛡️  CareGuard AI Backend running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Ready to accept connections...\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
