import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Validates `req[source]` against a Zod schema and replaces it with the
 * parsed (coerced) result so controllers receive clean, typed input.
 */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      // Log validation failures with field-level detail to aid debugging.
      logger.warn(`Validation failed for ${source} — ${JSON.stringify(details)}`);
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    return next();
  };
