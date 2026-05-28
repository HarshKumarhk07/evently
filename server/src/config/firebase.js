import admin from 'firebase-admin';
import env from './env.js';
import logger from '../utils/logger.js';

/**
 * Firebase Admin SDK — only initialised when service-account credentials are
 * configured. We use it solely to verify the ID token the client returns from
 * Google sign-in; user state still lives in our own MongoDB + JWT.
 */
let firebaseApp = null;

if (env.hasFirebase) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey,
      }),
    });
    logger.success(`Firebase admin ready (project: ${env.firebase.projectId})`);
  } catch (err) {
    logger.error(`Firebase admin init failed: ${err.message}`);
  }
} else {
  logger.warn('Firebase admin keys not set — Google sign-in is disabled');
}

/**
 * Verifies a Firebase ID token. Resolves to the decoded payload
 * (uid, email, name, picture, email_verified, …) on success.
 */
export function verifyIdToken(idToken) {
  if (!firebaseApp) {
    throw new Error('Google sign-in is not configured on this server');
  }
  return admin.auth().verifyIdToken(idToken);
}

export default firebaseApp;
