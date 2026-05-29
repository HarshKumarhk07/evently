import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';

/**
 * Generic listing model for fully-custom admin-created categories
 * (NavLinks without a built-in `targetVertical`). One CustomListing is
 * linked to one NavLink via `category`. Mirrors the shape of Restaurant /
 * Play / Event so the rest of the app (filters, cards, reviews, bookings)
 * can render it without special-casing.
 */
const customListingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    /* NavLink _id that this listing belongs to. */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NavLink',
      required: true,
      index: true,
    },
    city: { type: String, required: true, index: true },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', index: true },
    locality: { type: String, default: '' },
    address: { type: String, default: '' },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    coverImage: { type: String, default: '' },
    gallery: [{ type: String }],
    /* Generic per-unit price — admins can leave 0 for "free". */
    price: { type: Number, default: 0 },
    priceLabel: { type: String, default: 'per booking' },
    /* Free-form tags so admins can attach ad-hoc filterable values. */
    tags: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true },
);

customListingSchema.index({ name: 'text', description: 'text', tags: 'text' });

customListingSchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = `${slugify(this.name)}-${Date.now().toString(36).slice(-4)}`;
  }
  next();
});

export default mongoose.model('CustomListing', customListingSchema);
