import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';

const seatCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    totalSeats: { type: Number, default: 50 },
    bookedSeats: { type: Number, default: 0 },
  },
  { _id: true },
);

const playSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    genre: [{ type: String }],
    language: { type: String, default: 'English' },
    duration: { type: Number, default: 120 },
    ageRating: { type: String, default: 'U/A' },
    city: { type: String, required: true, index: true },
    venue: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    location: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
    },
    coverImage: { type: String, default: '' },
    gallery: [{ type: String }],
    cast: [{ name: String, role: String, image: String }],
    showtimes: [{ type: Date }],
    seatCategories: [seatCategorySchema],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/* `language_override` keeps MongoDB from treating the `language` field
   as the text-index language (e.g. "Hindi" is not a valid index language). */
playSchema.index(
  { title: 'text', description: 'text', genre: 'text' },
  { language_override: 'textIndexLanguage' },
);

playSchema.virtual('priceFrom').get(function priceFrom() {
  if (!this.seatCategories?.length) return 0;
  return Math.min(...this.seatCategories.map((c) => c.price));
});

playSchema.set('toJSON', { virtuals: true });
playSchema.set('toObject', { virtuals: true });

playSchema.pre('validate', function setSlug(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = `${slugify(this.title)}-${Date.now().toString(36).slice(-4)}`;
  }
  next();
});

export default mongoose.model('Play', playSchema);
