import app from './app.js';
import env from './config/env.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';

async function start() {
  try {
    await connectDB();
    const server = app.listen(env.port, () => {
      logger.success(`Bookify API running on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = (signal) => {
      logger.warn(`${signal} received — shutting down`);
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});

start();
