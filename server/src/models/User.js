import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const favoriteSchema = new mongoose.Schema(
  {
    refType: { type: String, enum: ['Restaurant', 'Play', 'Event'], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

const mediaSchema = new mongoose.Schema(
  { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  { _id: false },
);

/* Manager business profile — only populated when role === 'manager'. */
const managerProfileSchema = new mongoose.Schema(
  {
    businessName: { type: String, trim: true, maxlength: 120 },
    businessType: {
      type: String,
      enum: ['Restaurant', 'Turf', 'Event', 'Play', 'Activity'],
    },
    businessAddress: { type: String, trim: true },
    /* Identity & compliance docs — Aadhaar/PAN stored verbatim for the demo,
       in production these should be encrypted at rest or referenced via a
       compliance vault. */
    gstNumber: { type: String, trim: true, default: '' },
    panNumber: { type: String, trim: true, default: '' },
    aadhaarNumber: { type: String, trim: true, default: '' },
    businessLicense: { type: mediaSchema, default: () => ({}) },
    idProof: { type: mediaSchema, default: () => ({}) },
    businessImages: { type: [mediaSchema], default: [] },
    bankDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
    },
    /* Lifecycle of a manager account:
         pending_email     → just signed up, waiting on email verification
         pending_approval  → email verified, awaiting admin review
         approved          → can access dashboard, create listings
         rejected          → admin declined; `rejectionReason` set
         suspended         → admin paused the account                       */
    status: {
      type: String,
      enum: ['pending_email', 'pending_approval', 'approved', 'rejected', 'suspended'],
      default: 'pending_email',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
    /* Password is only required for the email-provider flow.
       Google users authenticate via Firebase and have no password. */
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: function requirePassword() {
        return this.provider === 'email';
      },
    },
    phone: { type: String, trim: true },
    city: { type: String, default: 'Bengaluru' },
    role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user', index: true },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    /* OAuth fields. `googleId` is the Firebase UID returned for Google logins. */
    provider: { type: String, enum: ['email', 'google'], default: 'email' },
    googleId: { type: String, index: true, sparse: true, unique: true },

    /* Wishlist & recently viewed (consumer-side, no-op for managers). */
    favorites: [favoriteSchema],
    recentlyViewed: [favoriteSchema],

    /* Email verification — used by managers (required) and any user that
       wants to confirm their address. */
    isVerified: { type: Boolean, default: false },
    /* 6-digit OTP — stored hashed, expires after 10 minutes. */
    emailOTP: { type: String, select: false },
    emailOTPExpires: { type: Date, select: false },
    /* Throttle resends so we don't get marked as spam. */
    emailOTPLastSentAt: { type: Date, select: false },
    /* Brute-force protection — after N wrong attempts the OTP is wiped and
       the user must request a fresh code. */
    emailOTPAttempts: { type: Number, default: 0, select: false },
    /* Legacy token-link verification (kept for backwards compatibility — the
       OTP flow above is the canonical one going forward). */
    emailVerificationToken: { type: String, select: false, index: true },
    emailVerificationExpires: { type: Date, select: false },

    /* Password reset OTP. */
    resetOTP: { type: String, select: false },
    resetOTPExpires: { type: Date, select: false },

    /* Manager-specific business profile. */
    managerProfile: { type: managerProfileSchema, default: undefined },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword(next) {
  /* Skip when the field was untouched, OR when there's no password at all
     (Google-provider accounts). */
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetOTP;
  delete obj.resetOTPExpires;
  delete obj.emailOTP;
  delete obj.emailOTPExpires;
  delete obj.emailOTPLastSentAt;
  delete obj.emailOTPAttempts;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);
