import NavLink from '../models/NavLink.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/ApiResponse.js';

/* The first-run defaults that exist before the admin touches anything. */
const DEFAULTS = [
  { label: 'For You', path: '/',        end: true,  displayOrder: 0 },
  { label: 'Dining',  path: '/dining',  end: false, displayOrder: 1 },
  { label: 'Plays',   path: '/plays',   end: false, displayOrder: 2 },
  { label: 'Events',  path: '/events',  end: false, displayOrder: 3 },
];

async function seedIfEmpty() {
  const count = await NavLink.countDocuments();
  if (count > 0) return;
  await NavLink.insertMany(DEFAULTS, { ordered: false }).catch(() => {});
}

/* GET /api/nav-links — public, returns active items in display order. */
export const listNavLinks = asyncHandler(async (_req, res) => {
  await seedIfEmpty();
  const items = await NavLink.find({ isActive: true })
    .sort({ displayOrder: 1, _id: 1 })
    .lean();
  return ok(res, items);
});

/* GET /api/nav-links/lookup?slug=:slug — public, returns the dynamic-category
   config for `/c/:slug` so the React app can render it. */
export const lookupNavLink = asyncHandler(async (req, res) => {
  const slug = String(req.query.slug || '').trim();
  if (!slug) throw ApiError.badRequest('slug query param is required');
  const target = `/c/${slug}`;
  const link = await NavLink.findOne({ path: target, isActive: true }).lean();
  if (!link) throw ApiError.notFound('Custom category not found');
  return ok(res, link);
});

/* POST /api/admin/nav-links */
export const createNavLink = asyncHandler(async (req, res) => {
  const {
    label,
    path,
    end = false,
    displayOrder = 99,
    targetVertical = null,
    filters = {},
    heroImage = '',
    heroSubtitle = '',
  } = req.body;
  if (!label?.trim()) throw ApiError.badRequest('Label is required');
  if (!path?.trim() || !path.startsWith('/')) {
    throw ApiError.badRequest('Path must start with "/"');
  }
  const link = await NavLink.create({
    label: label.trim(),
    path: path.trim(),
    end: Boolean(end),
    targetVertical: targetVertical || null,
    filters: filters || {},
    heroImage: heroImage || '',
    heroSubtitle: heroSubtitle || '',
    displayOrder,
  });
  return created(res, link, 'Nav link created');
});

/* PATCH /api/admin/nav-links/:id */
export const updateNavLink = asyncHandler(async (req, res) => {
  const {
    label,
    path,
    end,
    displayOrder,
    isActive,
    targetVertical,
    filters,
    heroImage,
    heroSubtitle,
  } = req.body;
  const link = await NavLink.findById(req.params.id);
  if (!link) throw ApiError.notFound('Nav link not found');
  if (label !== undefined) link.label = label.trim();
  if (path !== undefined) {
    if (!path.startsWith('/')) throw ApiError.badRequest('Path must start with "/"');
    link.path = path.trim();
  }
  if (end !== undefined) link.end = Boolean(end);
  if (displayOrder !== undefined) link.displayOrder = Number(displayOrder) || 0;
  if (isActive !== undefined) link.isActive = Boolean(isActive);
  if (targetVertical !== undefined) link.targetVertical = targetVertical || null;
  if (filters !== undefined) {
    link.filters = filters || {};
    link.markModified('filters');
  }
  if (heroImage !== undefined) link.heroImage = heroImage || '';
  if (heroSubtitle !== undefined) link.heroSubtitle = heroSubtitle || '';
  await link.save();
  return ok(res, link, 'Nav link updated');
});

/* DELETE /api/admin/nav-links/:id */
export const deleteNavLink = asyncHandler(async (req, res) => {
  const link = await NavLink.findByIdAndDelete(req.params.id);
  if (!link) throw ApiError.notFound('Nav link not found');
  return ok(res, null, 'Nav link deleted');
});
