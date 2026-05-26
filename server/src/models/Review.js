import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: ['Restaurant', 'Play', 'Event'], required: true },
    item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemType' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true },
);

/* One review per user per listing. */
reviewSchema.index({ user: 1, item: 1 }, { unique: true });

/* Recompute the parent listing's aggregate rating after writes. */
reviewSchema.statics.syncRating = async function syncRating(itemType, itemId) {
  const stats = await this.aggregate([
    { $match: { item: new mongoose.Types.ObjectId(itemId) } },
    { $group: { _id: '$item', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  const Model = mongoose.model(itemType);
  await Model.findByIdAndUpdate(itemId, {
    rating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
};

reviewSchema.post('save', function afterSave(doc) {
  doc.constructor.syncRating(doc.itemType, doc.item);
});

reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) mongoose.model('Review').syncRating(doc.itemType, doc.item);
});

export default mongoose.model('Review', reviewSchema);
