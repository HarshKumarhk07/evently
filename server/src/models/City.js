import mongoose from 'mongoose';

const citySchema = new mongoose.Schema(
  {
    cityName: { type: String, required: true, index: true },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    image: { type: String, default: '' },
    isPopular: { type: Boolean, default: false, index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

citySchema.index({ location: '2dsphere' });

export default mongoose.model('City', citySchema);
