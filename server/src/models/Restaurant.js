import mongoose from 'mongoose';
import { slugify } from '../utils/slug.js';

const imageSchema = new mongoose.Schema(
  { url: String, publicId: { type: String, default: '' } },
  { _id: false },
);

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    cuisine: [{ type: String }],
    priceRange: { type: Number, min: 1, max: 4, default: 2 },
    costForTwo: { type: Number, default: 1500 },
    city: { type: String, required: true, index: true },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', index: true },
    locality: { type: String, default: '' },
    address: { type: String, default: '' },
    location: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
    },
    locationGeo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.5946, 12.9716] },
    },
    coverImage: { type: String, default: '' },
    images: [imageSchema],
    gallery: [{ type: String }],
    menu: [
      {
        name: String,
        price: Number,
        category: String,
        veg: { type: Boolean, default: true },
        image: String,
      },
    ],
    features: [{ type: String }],
    openHours: { type: String, default: '12:00 PM – 11:00 PM' },
    tables: { type: Number, default: 20 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

restaurantSchema.index({ name: 'text', description: 'text', cuisine: 'text' });
restaurantSchema.index({ locationGeo: '2dsphere' });

restaurantSchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = `${slugify(this.name)}-${Date.now().toString(36).slice(-4)}`;
  }
  next();
});

export default mongoose.model('Restaurant', restaurantSchema);
