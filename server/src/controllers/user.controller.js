import mongoose from 'mongoose';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { uploadBuffer } from '../config/cloudinary.js';

/* PATCH /api/users/me */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });
  return ok(res, user, 'Profile updated');
});

/* POST /api/users/me/avatar — multipart image upload. */
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image provided');

  const result = await uploadBuffer(req.file.buffer, 'bookify/avatars');
  if (!result) throw ApiError.badRequest('Image hosting is not configured on this server');

  req.user.avatar = { url: result.secure_url, publicId: result.public_id };
  await req.user.save();
  return ok(res, req.user, 'Avatar updated');
});

/* GET /api/users/me/favorites — favorites grouped & resolved per collection. */
export const getFavorites = asyncHandler(async (req, res) => {
  const grouped = { Restaurant: [], Play: [], Event: [] };
  req.user.favorites.forEach((f) => grouped[f.refType]?.push(f.refId));

  const [restaurants, plays, events] = await Promise.all([
    mongoose.model('Restaurant').find({ _id: { $in: grouped.Restaurant } }).lean(),
    mongoose.model('Play').find({ _id: { $in: grouped.Play } }).lean(),
    mongoose.model('Event').find({ _id: { $in: grouped.Event } }).lean(),
  ]);

  return ok(res, { restaurants, plays, events });
});

/* POST /api/users/me/favorites — toggle a listing in/out of favorites. */
export const toggleFavorite = asyncHandler(async (req, res) => {
  const { refType, refId } = req.body;
  if (!['Restaurant', 'Play', 'Event'].includes(refType) || !refId) {
    throw ApiError.badRequest('refType and refId are required');
  }

  const idx = req.user.favorites.findIndex(
    (f) => f.refType === refType && String(f.refId) === String(refId),
  );
  let favorited;
  if (idx >= 0) {
    req.user.favorites.splice(idx, 1);
    favorited = false;
  } else {
    req.user.favorites.push({ refType, refId });
    favorited = true;
  }
  await req.user.save();
  return ok(res, { favorited, favorites: req.user.favorites }, favorited ? 'Added to favorites' : 'Removed from favorites');
});

/* GET /api/users/me/recently-viewed */
export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const grouped = { Restaurant: [], Play: [], Event: [] };
  req.user.recentlyViewed.forEach((r) => grouped[r.refType]?.push(r.refId));

  const [restaurants, plays, events] = await Promise.all([
    mongoose.model('Restaurant').find({ _id: { $in: grouped.Restaurant } }).lean(),
    mongoose.model('Play').find({ _id: { $in: grouped.Play } }).lean(),
    mongoose.model('Event').find({ _id: { $in: grouped.Event } }).lean(),
  ]);

  /* Preserve the most-recent-first order from the user document. */
  const all = [
    ...restaurants.map((r) => ({ ...r, _kind: 'Restaurant' })),
    ...plays.map((p) => ({ ...p, _kind: 'Play' })),
    ...events.map((e) => ({ ...e, _kind: 'Event' })),
  ];
  const ordered = req.user.recentlyViewed
    .map((r) => all.find((x) => String(x._id) === String(r.refId)))
    .filter(Boolean);

  return ok(res, ordered);
});
