/**
 * Translates `req.query` into a Mongoose-ready { filter, sort, page, limit, skip }.
 * Keeps controllers free of repetitive pagination / sorting boilerplate.
 */
export function buildQuery(query, { searchFields = [], allowedSorts = {} } = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.search && searchFields.length) {
    const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = searchFields.map((f) => ({ [f]: rx }));
  }

  const sortMap = {
    newest: { createdAt: -1 },
    rating: { rating: -1 },
    'price-low': { price: 1 },
    'price-high': { price: -1 },
    popular: { reviewCount: -1 },
    ...allowedSorts,
  };
  const sort = sortMap[query.sort] || { createdAt: -1 };

  return { page, limit, skip, filter, sort };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
