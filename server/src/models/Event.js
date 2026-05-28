import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';

const ticketTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    totalQuantity: { type: Number, default: 100 },
    soldQuantity: { type: Number, default: 0 },
    perks: [{ type: String }],
  },
  { _id: true },
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Music', 'Comedy', 'Workshop', 'Sports', 'Festival', 'Tech', 'Art', 'Nightlife'],
      default: 'Music',
      index: true,
    },
    city: { type: String, required: true, index: true },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', index: true },
    locality: { type: String, default: '' },
    venue: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    location: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
    },
    locationGeo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.5946, 12.9716] },
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    coverImage: { type: String, default: '' },
    gallery: [{ type: String }],
    ticketTypes: [ticketTypeSchema],
    lineup: [{ name: String, image: String }],
    organizer: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    /* The manager who owns this listing — see Restaurant.js for semantics. */
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true },
);

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ locationGeo: '2dsphere' });

eventSchema.virtual('priceFrom').get(function priceFrom() {
  if (!this.ticketTypes?.length) return 0;
  return Math.min(...this.ticketTypes.map((t) => t.price));
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

eventSchema.pre('validate', function setSlug(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = `${slugify(this.title)}-${Date.now().toString(36).slice(-4)}`;
  }
  next();
});

export default mongoose.model('Event', eventSchema);
