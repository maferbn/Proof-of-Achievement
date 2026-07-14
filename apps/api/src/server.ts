import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import groupRoutes from './routes/groups.routes';
import badgeRoutes from './routes/badges.routes';
import { eventIndexer } from './services/event-indexer.service';
import { ipfsService } from './services/ipfs.service';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: config.corsOrigin }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    eventIndexer: eventIndexer.isRunning() ? 'running' : 'stopped',
    ipfs: ipfsService.isConfigured() ? 'configured' : 'not configured',
  });
});

// Routes
app.use('/', authRoutes);
app.use('/', groupRoutes);
app.use('/', badgeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = config.port;
const server = app.listen(port, () => {
  console.log(`Reputation Badge backend listening on port ${port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`CORS origin: ${config.corsOrigin}`);
  console.log(`IPFS configured: ${ipfsService.isConfigured()}`);

  // Start the event indexer after the server is listening
  eventIndexer.start();
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  eventIndexer.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
