import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { Textarea } from '../ui/Input.jsx';
import { Stars, StarInput } from '../ui/Rating.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { reviewsApi } from '../../api/reviews.api.js';
import { formatDate } from '../../lib/format.js';

/* Reviews list + inline submission form for a given listing. */
export default function ReviewSection({ itemType, itemId, initialReviews = [] }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Please pick a rating');
    setSubmitting(true);
    try {
      const review = await reviewsApi.create({ itemType, itemId, rating, comment });
      setReviews((prev) => {
        const without = prev.filter((r) => r.user?._id !== user._id);
        return [{ ...review, user: { _id: user._id, name: user.name, avatar: user.avatar } }, ...without];
      });
      setRating(0);
      setComment('');
      toast.success('Thanks for your review');
    } catch (err) {
      toast.error(err.message || 'Could not post review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-white">
        Reviews{reviews.length > 0 && <span className="text-slate-500"> ({reviews.length})</span>}
      </h2>

      {isAuthenticated ? (
        <form onSubmit={submit} className="glass-soft rounded-2xl p-4">
          <p className="mb-2 text-sm font-medium text-slate-300">Rate your experience</p>
          <StarInput value={rating} onChange={setRating} />
          <Textarea
            className="mt-3"
            placeholder="Share what stood out…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm" loading={submitting}>
              Post review
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-xl border border-dashed border-ink-600 px-4 py-3 text-sm text-slate-400">
          Log in to leave a review.
        </p>
      )}

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="Be the first to share your experience."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id} className="glass-soft rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Avatar name={review.user?.name} src={review.user?.avatar?.url} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{review.user?.name}</p>
                    <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
                  </div>
                  <Stars value={review.rating} size="h-3.5 w-3.5" />
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
