import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

mongoose.set('strictQuery', true);

/* Collections whose indexes have changed over time — running syncIndexes()
   makes Mongoose drop any leftover unique constraints (e.g. an old `slug`
   index on `categories`) so writes don't fail with cryptic "already in use"
   errors. */
async function syncStaleIndexes() {
  /* Lazy import so the model is guaranteed to be registered. */
  const { default: Category } = await import('../models/Category.js');
  try {
    await Category.syncIndexes();
  } catch (e) {
    logger.warn(`syncIndexes failed for Category: ${e.message}`);
  }
}

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.success(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    /* Non-blocking — don't hold app start hostage if a sync is slow. */
    syncStaleIndexes().catch(() => {});
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
