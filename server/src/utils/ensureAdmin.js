/* eslint-disable no-console */
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

async function run() {
  await connectDB();

  const payload = {
    name: 'Bookify Admin',
    email: 'admin@bookify.app',
    password: 'admin123',
    role: 'admin',
    city: 'Bengaluru',
    isVerified: true,
  };

  const existing = await User.findOne({ email: payload.email }).select('+password');
  if (existing) {
    existing.name = payload.name;
    existing.role = payload.role;
    existing.city = payload.city;
    existing.isVerified = true;
    existing.password = payload.password;
    await existing.save();
    console.log('Updated admin@bookify.app / admin123');
  } else {
    await User.create(payload);
    console.log('Created admin@bookify.app / admin123');
  }

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to ensure admin user:', err);
  process.exit(1);
});
