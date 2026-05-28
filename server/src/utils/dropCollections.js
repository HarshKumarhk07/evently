import { connectDB, disconnectDB } from '../config/db.js';
import mongoose from 'mongoose';

const collectionsToDrop = [
  'events',
  'plays',
  'restaurants',
  'bookings',
  'payments',
  'reviews',
];

async function drop() {
  await connectDB();
  const db = mongoose.connection.db;

  for (const name of collectionsToDrop) {
    try {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (!exists) {
        console.log(`SKIP  ${name} (not found)`);
        continue;
      }
      await db.dropCollection(name);
      console.log(`DROPPED ${name}`);
    } catch (err) {
      console.error(`ERROR dropping ${name}: ${err.message}`);
    }
  }

  await disconnectDB();
  process.exit(0);
}

drop().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
