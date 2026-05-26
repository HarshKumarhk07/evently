import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/* Converts any thrown value into a consistent JSON error response. */
export function errorHandler(err, _req, res, _next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map((e) => e.message);
      error = ApiError.badRequest('Validation failed', details);
    } else if (err.name === 'CastError') {
      error = ApiError.badRequest(`Invalid ${err.path}`);
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      error = ApiError.conflict(`That ${field} is already in use`);
    } else if (err.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid token');
    } else {
      error = new ApiError(500, env.isProd ? 'Something went wrong' : err.message);
    }
  }

  if (error.statusCode >= 500) {
    logger.error(`${error.message}\n${err.stack || ''}`);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(!env.isProd && error.statusCode >= 500 && { stack: err.stack }),
  });
}
