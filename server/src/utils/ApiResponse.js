/* Consistent success envelope used by every controller. */
export function ok(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function created(res, data = null, message = 'Created') {
  return ok(res, data, message, 201);
}

/**
 * Paginated list envelope.
 * @param {object} meta { page, limit, total }
 */
export function paginated(res, items, meta, message = 'Success') {
  const { page, limit, total } = meta;
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
        hasMore: page * limit < total,
      },
    },
  });
}
