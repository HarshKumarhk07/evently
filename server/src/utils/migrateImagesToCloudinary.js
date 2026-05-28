/* eslint-disable no-console */
/**
 * One-shot script that walks every Restaurant / Play / Event in the DB,
 * downloads each image URL that's NOT already on Cloudinary, re-uploads
 * the same bytes to Cloudinary, and rewrites the document with the new
 * `secure_url`.
 *
 * Idempotent — running it twice is a no-op for already-migrated URLs.
 *
 * Usage:
 *   cd server
 *   npm run migrate:images
 */
import env from '../config/env.js';
import { connectDB } from '../config/db.js';
import { uploadBuffer } from '../config/cloudinary.js';
import Restaurant from '../models/Restaurant.js';
import Play from '../models/Play.js';
import Event from '../models/Event.js';
import logger from './logger.js';

/* True if the URL is already a Cloudinary asset — skip those. */
const isOnCloudinary = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');

/* Cap parallel uploads so we don't slam Cloudinary's free-tier rate limit. */
const CONCURRENCY = 4;

async function fetchAsBuffer(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Re-host one URL on Cloudinary.
 * Returns the new URL on success, the original URL on any failure.
 */
async function rehost(url, folder) {
  if (!url || isOnCloudinary(url)) return url;
  try {
    const buffer = await fetchAsBuffer(url);
    const result = await uploadBuffer(buffer, folder);
    if (!result?.secure_url) throw new Error('no secure_url returned');
    return result.secure_url;
  } catch (err) {
    logger.warn(`  skipped ${url.slice(0, 60)}… (${err.message})`);
    return url;
  }
}

/* Limited concurrency helper — works through `items` running at most
   `n` rehost tasks in flight at a time. */
async function pool(items, n, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: n }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function migrateRestaurants() {
  const items = await Restaurant.find({});
  logger.info(`Restaurants: ${items.length}`);
  for (const item of items) {
    const folder = 'bookify/restaurants';
    item.coverImage = await rehost(item.coverImage, folder);
    item.gallery = await pool(item.gallery || [], CONCURRENCY, (u) =>
      rehost(u, `${folder}/gallery`),
    );
    if (item.menu?.length) {
      await pool(item.menu, CONCURRENCY, async (dish) => {
        dish.image = await rehost(dish.image, `${folder}/menu`);
      });
    }
    await item.save();
    logger.success(`  ✓ ${item.name}`);
  }
}

async function migratePlays() {
  const items = await Play.find({});
  logger.info(`Plays: ${items.length}`);
  for (const item of items) {
    const folder = 'bookify/plays';
    item.coverImage = await rehost(item.coverImage, folder);
    item.gallery = await pool(item.gallery || [], CONCURRENCY, (u) =>
      rehost(u, `${folder}/gallery`),
    );
    if (item.cast?.length) {
      await pool(item.cast, CONCURRENCY, async (member) => {
        member.image = await rehost(member.image, `${folder}/cast`);
      });
    }
    await item.save();
    logger.success(`  ✓ ${item.title}`);
  }
}

async function migrateEvents() {
  const items = await Event.find({});
  logger.info(`Events: ${items.length}`);
  for (const item of items) {
    const folder = 'bookify/events';
    item.coverImage = await rehost(item.coverImage, folder);
    item.gallery = await pool(item.gallery || [], CONCURRENCY, (u) =>
      rehost(u, `${folder}/gallery`),
    );
    if (item.lineup?.length) {
      await pool(item.lineup, CONCURRENCY, async (act) => {
        act.image = await rehost(act.image, `${folder}/lineup`);
      });
    }
    await item.save();
    logger.success(`  ✓ ${item.title}`);
  }
}

async function run() {
  if (!env.hasCloudinary) {
    logger.error(
      'Cloudinary keys missing — set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in server/.env first',
    );
    process.exit(1);
  }

  await connectDB();
  logger.info(`Migrating to Cloudinary cloud: ${env.cloudinary.cloudName}`);

  await migrateRestaurants();
  await migratePlays();
  await migrateEvents();

  /* Let any in-flight saves drain, then exit hard to avoid the
     graceful-close race we hit in the seed script. */
  await new Promise((resolve) => setTimeout(resolve, 600));
  logger.success('Cloudinary migration complete ✨');
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Migration failed: ${err.message}`);
  process.exit(1);
});
