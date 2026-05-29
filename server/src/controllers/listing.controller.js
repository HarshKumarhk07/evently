import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { buildQuery } from '../utils/queryFeatures.js';
import Review from '../models/Review.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Type-specific filters layered on top of the shared search/sort/pagination. */
const filterStrategies = {
  Restaurant: (q, filter) => {
    if (q.cuisine) filter.cuisine = { $in: q.cuisine.split(',') };
    /* costForTwo bucket range — costMin / costMax are inclusive rupee bounds. */
    if (q.costMin || q.costMax) {
      filter.costForTwo = {};
      if (q.costMin) filter.costForTwo.$gte = Number(q.costMin);
      if (q.costMax) filter.costForTwo.$lte = Number(q.costMax);
    }
    if (q.minRating) filter.rating = { $gte: Number(q.minRating) };
    if (q.feature) filter.features = { $in: q.feature.split(',') };
  },
  Play: (q, filter) => {
    if (q.genre) filter.genre = { $in: q.genre.split(',') };
    if (q.language) filter.language = q.language;
    if (q.minRating) filter.rating = { $gte: Number(q.minRating) };
  },
  Event: (q, filter) => {
    if (q.category) filter.category = { $in: q.category.split(',') };
    if (q.upcoming === 'true') filter.startDate = { $gte: new Date() };
    if (q.minRating) filter.rating = { $gte: Number(q.minRating) };
  },
};

const searchFieldsByType = {
  Restaurant: ['name', 'description', 'cuisine', 'tags'],
  Play: ['title', 'description', 'genre', 'tags'],
  Event: ['title', 'description', 'tags'],
};

/* Builds a full set of REST handlers for a given listing model. */
export function createListingController(Model, typeName) {
  const list = asyncHandler(async (req, res) => {
    const { page, limit, skip, filter, sort } = buildQuery(req.query, {
      searchFields: searchFieldsByType[typeName],
    });

    /* Match by ObjectId OR by name — listings created before cityId was
       tracked only have the city string, so an OR keeps them visible when
       the user picks that same city via the picker. */
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
    filterStrategies[typeName]?.(req.query, filter);

    // Proximity search: if lat/lng provided, use aggregation with $geoNear
    const lat = req.query.lat ? Number(req.query.lat) : null;
    const lng = req.query.lng ? Number(req.query.lng) : null;
    if (lat !== null && lng !== null) {
      const near = { type: 'Point', coordinates: [lng, lat] };
      const maxDistance = req.query.maxDistance ? Number(req.query.maxDistance) : undefined;
      const pipeline = [];
      pipeline.push({
        $geoNear: Object.assign(
          {
            near,
            distanceField: 'distance',
            spherical: true,
            query: filter,
          },
          maxDistance ? { maxDistance } : {},
        ),
      });
      if (sort) pipeline.push({ $sort: sort });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      const [items, totalArr] = await Promise.all([
        Model.aggregate(pipeline),
        Model.countDocuments(filter),
      ]);
      return paginated(res, items, { page, limit, total: totalArr });
    }

    const [items, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);

    return paginated(res, items, { page, limit, total });
  });

  const getBySlug = asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const query = mongoose.isValidObjectId(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    const item = await Model.findOne(query).lean();
    if (!item) throw ApiError.notFound(`${typeName} not found`);

    const reviews = await Review.find({ item: item._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    /* Track recently viewed for logged-in users (best-effort, non-blocking). */
    if (req.user) {
      const entry = { refType: typeName, refId: item._id };
      req.user.recentlyViewed = [
        entry,
        ...req.user.recentlyViewed.filter((r) => String(r.refId) !== String(item._id)),
      ].slice(0, 12);
      req.user.save().catch(() => {});
    }

    return ok(res, { ...item, reviews });
  });

  const getSimilar = asyncHandler(async (req, res) => {
    const base = await Model.findById(req.params.id).lean();
    if (!base) throw ApiError.notFound(`${typeName} not found`);
      const items = await Model.find({
        _id: { $ne: base._id },
        cityId: base.cityId || base.city,
        isActive: true,
      })
      .sort({ rating: -1 })
      .limit(6)
      .lean();
    return ok(res, items);
  });

  /* Internal helper: true when the caller is either the listing's owner or
     an admin. Admins always pass; managers only pass for their own listings. */
  function canMutate(item, user) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!item.owner) return false;
    return String(item.owner) === String(user._id);
  }

  const create = asyncHandler(async (req, res) => {
    const payload = { ...req.body };

    /* Attach sensible default ticket tiers so new listings are bookable. */
    if (typeName === 'Play' && !payload.seatCategories?.length) {
      payload.seatCategories = [
        { name: 'Premium', price: 999, totalSeats: 60 },
        { name: 'Gold', price: 699, totalSeats: 90 },
        { name: 'Silver', price: 399, totalSeats: 120 },
      ];
    }
    if (typeName === 'Event' && !payload.ticketTypes?.length) {
      payload.ticketTypes = [
        { name: 'General', price: 799, totalQuantity: 300 },
        { name: 'VIP', price: 2499, totalQuantity: 60 },
      ];
    }

    /* Auto-attach ownership unless the caller is an admin explicitly creating
       on behalf of someone else (in which case they supply `owner` in the body). */
    if (!payload.owner) payload.owner = req.user._id;

    const item = await Model.create(payload);
    return created(res, item, `${typeName} created`);
  });

  const update = asyncHandler(async (req, res) => {
    const existing = await Model.findById(req.params.id);
    if (!existing) throw ApiError.notFound(`${typeName} not found`);
    if (!canMutate(existing, req.user)) {
      throw ApiError.forbidden('You can only edit listings you own');
    }

    /* Managers cannot transfer ownership — strip the field. */
    const payload = { ...req.body };
    if (req.user.role !== 'admin') delete payload.owner;

    /* Use Mongoose's set() instead of Object.assign so nested paths
       (location, locationGeo) are tracked as modified and persisted. */
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined) return;
      existing.set(key, value);
      existing.markModified(key);
    });

    await existing.save();
    /* Re-read so the client sees exactly what the DB now holds (defensive
       against any post-save mutation). */
    const fresh = await Model.findById(existing._id).lean();
    return ok(res, fresh, `${typeName} updated`);
  });

  const remove = asyncHandler(async (req, res) => {
    const existing = await Model.findById(req.params.id);
    if (!existing) throw ApiError.notFound(`${typeName} not found`);
    if (!canMutate(existing, req.user)) {
      throw ApiError.forbidden('You can only delete listings you own');
    }
    await existing.deleteOne();
    return ok(res, null, `${typeName} deleted`);
  });

  return { list, getBySlug, getSimilar, create, update, remove };
}
