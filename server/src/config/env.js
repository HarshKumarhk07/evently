import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookify',
  jwtSecret: process.env.JWT_SECRET || 'bookify_dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL || process.env.MAIL_FROM_EMAIL || 'no-reply@bookify.app',
    senderName: process.env.BREVO_SENDER_NAME || 'Bookify',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    /* Private keys are stored as one line in env vars — restore newlines here. */
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
};

env.isProd = env.nodeEnv === 'production';
env.hasCloudinary = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
);
env.hasRazorpay = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
env.hasMail = Boolean(env.brevo.apiKey && env.brevo.senderEmail);
env.hasFirebase = Boolean(
  env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey,
);

export default env;
