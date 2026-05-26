import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const favoriteSchema = new mongoose.Schema(
  {
    refType: { type: String, enum: ['Restaurant', 'Play', 'Event'], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    city: { type: String, default: 'Bengaluru' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    favorites: [favoriteSchema],
    recentlyViewed: [favoriteSchema],
    isVerified: { type: Boolean, default: false },
    resetOTP: { type: String, select: false },
    resetOTPExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetOTP;
  delete obj.resetOTPExpires;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);
