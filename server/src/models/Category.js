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
    /* Vertical only applies to built-in kinds; `custom` kind entries don't
       have one (they're scoped via `navLinkId` instead), so this is not
       required. The enum allows an empty string for custom entries. */
    vertical: {
      type: String,
      enum: ['dining', 'plays', 'events', ''],
      default: '',
      index: true,
    },
    kind: {
      type: String,
      /* 'custom' is used for entries managed under a standalone NavLink
         category (e.g. /c/test) — those have `navLinkId` set instead of a
         hard-coded vertical. */
      enum: ['cuisine', 'category', 'genre', 'feature', 'custom'],
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    /* Optional pointer to the NavLink this entry belongs to — only set for
       sub-categories of custom standalone categories. */
    navLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NavLink',
      default: null,
      index: true,
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index(
  { kind: 1, navLinkId: 1, parentId: 1, name: 1 },
  { unique: true },
);

export default mongoose.model('Category', categorySchema);
