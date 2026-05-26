import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';

/* GET /api/reviews?itemType=&itemId= */
export const listReviews = asyncHandler(async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) throw ApiError.badRequest('itemId is required');

  const reviews = await Review.find({ item: itemId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();
  return ok(res, reviews);
});

/* POST /api/reviews */
export const createReview = asyncHandler(async (req, res) => {
  const { itemType, itemId, rating, comment } = req.body;

  const existing = await Review.findOne({ user: req.user._id, item: itemId });
  if (existing) {
    existing.rating = rating;
    existing.comment = comment || '';
    await existing.save();
    return ok(res, existing, 'Review updated');
  }

  const review = await Review.create({
    user: req.user._id,
    itemType,
    item: itemId,
    rating,
    comment,
  });
  await review.populate('user', 'name avatar');
  return created(res, review, 'Review posted');
});

/* DELETE /api/reviews/:id — owner or admin. */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  const isOwner = String(review.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own review');
  }

  await Review.findOneAndDelete({ _id: review._id });
  return ok(res, null, 'Review deleted');
});
