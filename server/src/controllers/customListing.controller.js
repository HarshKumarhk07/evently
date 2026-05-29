import mongoose from 'mongoose';
import CustomListing from '../models/CustomListing.js';
import Review from '../models/Review.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { buildQuery } from '../utils/queryFeatures.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* GET /api/custom-listings — public list, filterable by category + city. */
export const listCustomListings = asyncHandler(async (req, res) => {
  const { page, limit, skip, filter, sort } = buildQuery(req.query, {
    searchFields: ['name', 'description', 'tags'],
  });

  if (req.query.category) filter.category = req.query.category;
  if (req.query.cityId && req.query.city) {
    filter.$or = [
      { cityId: req.query.cityId },
      { city: new RegExp(`^${escapeRegex(req.query.city)}$`, 'i') },
    ];
  } else if (req.query.cityId) {
    filter.cityId = req.query.cityId;
  } else if (req.query.city) {
    filter.city = new RegExp(`^${escapeRegex(req.query.city)}$`, 'i');
  }
  if (req.query.featured === 'true') filter.isFeatured = true;
  filter.isActive = true;

  const [items, total] = await Promise.all([
    CustomListing.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    CustomListing.countDocuments(filter),
  ]);
  return paginated(res, items, { page, limit, total });
});

/* GET /api/custom-listings/:idOrSlug */
export const getCustomListing = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = mongoose.isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };
  const item = await CustomListing.findOne(query).lean();
  if (!item) throw ApiError.notFound('Listing not found');

  const reviews = await Review.find({ item: item._id })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return ok(res, { ...item, reviews });
});

function canMutate(item, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!item.owner) return false;
  return String(item.owner) === String(user._id);
}

/* POST /api/custom-listings */
export const createCustomListing = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.category) throw ApiError.badRequest('Category is required');
  if (!payload.name?.trim()) throw ApiError.badRequest('Name is required');
  if (!payload.city?.trim()) throw ApiError.badRequest('City is required');
  if (!payload.owner) payload.owner = req.user._id;
  const item = await CustomListing.create(payload);
  return created(res, item, 'Listing created');
});

/* PATCH /api/custom-listings/:id */
export const updateCustomListing = asyncHandler(async (req, res) => {
  const existing = await CustomListing.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Listing not found');
  if (!canMutate(existing, req.user)) {
    throw ApiError.forbidden('You can only edit listings you own');
  }
  const payload = { ...req.body };
  if (req.user.role !== 'admin') delete payload.owner;
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    existing.set(key, value);
    existing.markModified(key);
  });
  await existing.save();
  const fresh = await CustomListing.findById(existing._id).lean();
  return ok(res, fresh, 'Listing updated');
});

/* DELETE /api/custom-listings/:id */
export const removeCustomListing = asyncHandler(async (req, res) => {
  const existing = await CustomListing.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Listing not found');
  if (!canMutate(existing, req.user)) {
    throw ApiError.forbidden('You can only delete listings you own');
  }
  await existing.deleteOne();
  return ok(res, null, 'Listing deleted');
});
