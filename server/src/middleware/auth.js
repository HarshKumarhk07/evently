import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

/* Requires a valid JWT; attaches the user document to req.user. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Please log in to continue');

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  req.user = user;
  next();
});

/* Restricts a route to the given roles. Use after `protect`. */
export const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission for this action'));
    }
    return next();
  };

/* For listing-mutation routes: admins always pass; managers pass only when
   their account is approved. Use after `protect`. */
export const requireApprovedManagerOrAdmin = (req, _res, next) => {
  const { user } = req;
  if (!user) return next(ApiError.unauthorized());
  if (user.role === 'admin') return next();
  if (user.role === 'manager' && user.managerProfile?.status === 'approved') {
    return next();
  }
  if (user.role === 'manager') {
    return next(
      ApiError.forbidden('Your manager account is not approved yet — please wait for admin review'),
    );
  }
  return next(ApiError.forbidden('This action is restricted to managers and admins'));
};

/* Attaches req.user when a token is present but never blocks the request. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id);
  } catch {
    /* ignore — anonymous request */
  }
  return next();
});
