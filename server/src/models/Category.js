import mongoose from 'mongoose';

/**
 * Admin-managed taxonomy for the listing forms and filter sidebar.
 *
 * `vertical` mirrors the navbar verticals (dining / plays / events).
 * `kind` partitions catalogues within a vertical so a single Dining tab can
 * hold both cuisines (Italian) and features (Outdoor seating):
 *   - cuisine, feature → dining
 *   - genre           → plays
 *   - category        → events
 * `parentId` lets any entry be a sub-category of another (e.g. "Music" with
 * children "Rock", "Jazz", "Classical").
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    vertical: {
      type: String,
      enum: ['dining', 'plays', 'events'],
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['cuisine', 'category', 'genre', 'feature'],
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ kind: 1, parentId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
