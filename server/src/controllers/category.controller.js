import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/ApiResponse.js';

const VERTICALS = ['dining', 'plays', 'events'];
const KINDS = ['cuisine', 'category', 'genre', 'feature'];

/* The kind → vertical mapping so we can derive vertical from kind. */
const KIND_TO_VERTICAL = {
  cuisine: 'dining',
  feature: 'dining',
  genre: 'plays',
  category: 'events',
};

/* Seed values used on first visit so admins see something to start from.
   The Plays vertical is for turf / sport / activity bookings — not theatre. */
const DEFAULTS = {
  cuisine: ['North Indian', 'South Indian', 'Italian', 'Japanese', 'Chinese', 'Continental', 'Mediterranean', 'French', 'American', 'Cafe', 'Pan Asian'],
  feature: ['Outdoor Seating', 'Bar', 'Live Music', 'Valet Parking', 'Rooftop', 'Pet Friendly', 'Pure Veg'],
  genre: [
    'Box Cricket', 'Turf Cricket', 'Indoor Cricket', 'Net Practice',
    'Indoor Badminton', 'Outdoor Badminton',
    'Lawn Tennis', 'Table Tennis',
    'Volleyball Court',
    'Swimming Pool', 'Water Park',
    'Paintball', 'Go Karting', 'Laser Tag', 'Rock Climbing',
  ],
  category: ['Music', 'Comedy', 'Workshop', 'Sports', 'Festival', 'Tech', 'Art', 'Nightlife'],
};

/* Old genre defaults from the theatre era — auto-deleted on next request so
   the Plays vertical only carries the turf/sport list. */
const LEGACY_GENRES = ['Drama', 'Comedy', 'Thriller', 'Classic', 'Mystery', 'Historical', 'Solo'];

/* One-shot seeder: writes the bundled defaults the first time anyone asks
   for an empty kind. Safe to call repeatedly thanks to the unique index.
   For `genre`, also wipes the legacy theatre defaults that may already be in
   the DB so the Plays vertical reflects the turf/sport relaunch. */
async function seedIfEmpty(kind) {
  if (kind === 'genre') {
    await Category.deleteMany({ kind: 'genre', name: { $in: LEGACY_GENRES } }).catch(() => {});
  }
  const count = await Category.countDocuments({ kind, parentId: null });
  if (count > 0) return;
  const vertical = KIND_TO_VERTICAL[kind];
  const docs = DEFAULTS[kind].map((name, i) => ({
    name,
    kind,
    vertical,
    displayOrder: i,
  }));
  await Category.insertMany(docs, { ordered: false }).catch(() => {});
}

/* GET /api/categories — public, returns the active taxonomy.
   Filterable by `vertical`, `kind` and `parentId` (use 'null' for top-level). */
export const listCategories = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.vertical) {
    if (!VERTICALS.includes(req.query.vertical)) {
      throw ApiError.badRequest('Unknown vertical');
    }
    filter.vertical = req.query.vertical;
  }
  if (req.query.kind) {
    if (!KINDS.includes(req.query.kind)) throw ApiError.badRequest('Unknown kind');
    filter.kind = req.query.kind;
    /* Auto-seed defaults for kinds that haven't been populated yet — so the
       admin UI never looks empty on a fresh install. */
    await seedIfEmpty(req.query.kind);
  }
  if (req.query.parentId !== undefined) {
    filter.parentId = req.query.parentId === 'null' ? null : req.query.parentId;
  }
  const items = await Category.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  return ok(res, items);
});

/* POST /api/admin/categories — admin creates a new entry or sub-entry. */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, kind, parentId = null, displayOrder = 0 } = req.body;
  if (!name?.trim()) throw ApiError.badRequest('Name is required');
  if (!KINDS.includes(kind)) throw ApiError.badRequest('Invalid kind');

  let resolvedParent = null;
  if (parentId) {
    resolvedParent = await Category.findById(parentId);
    if (!resolvedParent) throw ApiError.badRequest('Parent category not found');
    if (resolvedParent.kind !== kind) {
      throw ApiError.badRequest('Sub-category must share its parent\'s kind');
    }
  }

  const c = await Category.create({
    name: name.trim(),
    kind,
    vertical: KIND_TO_VERTICAL[kind],
    parentId: resolvedParent?._id || null,
    displayOrder,
  });
  return created(res, c, 'Category created');
});

/* PATCH /api/admin/categories/:id */
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, displayOrder, isActive } = req.body;
  const c = await Category.findById(req.params.id);
  if (!c) throw ApiError.notFound('Category not found');
  if (name !== undefined) c.name = name.trim();
  if (displayOrder !== undefined) c.displayOrder = Number(displayOrder) || 0;
  if (isActive !== undefined) c.isActive = Boolean(isActive);
  await c.save();
  return ok(res, c, 'Category updated');
});

/* DELETE /api/admin/categories/:id — also removes any sub-categories. */
export const deleteCategory = asyncHandler(async (req, res) => {
  const c = await Category.findByIdAndDelete(req.params.id);
  if (!c) throw ApiError.notFound('Category not found');
  await Category.deleteMany({ parentId: c._id });
  return ok(res, null, 'Category deleted');
});
