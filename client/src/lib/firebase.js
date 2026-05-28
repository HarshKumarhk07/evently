import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from 'firebase/auth';

/**
 * Firebase is initialised only when all six VITE_FIREBASE_* env vars are
 * present. When they're not, `isFirebaseEnabled` is false and the Google
 * sign-in button hides itself — the rest of the app is unaffected.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseEnabled = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let firebaseAuth = null;

if (isFirebaseEnabled) {
  const app = initializeApp(config);
  firebaseAuth = getAuth(app);
  /* Persist the Firebase session across reloads so the popup doesn't have
     to re-authenticate on every page refresh. */
  setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {});
}

/**
 * Opens the Google sign-in popup and resolves with the Firebase ID token
 * that the backend can verify with the admin SDK.
 */
export async function signInWithGoogle() {
  if (!firebaseAuth) {
    throw new Error('Google sign-in is not configured on this client');
  }
  const provider = new GoogleAuthProvider();
  /* Always show the account chooser — avoids silently re-using a previous
     account, which is the most-confusing UX bug for Google sign-in. */
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(firebaseAuth, provider);
  return result.user.getIdToken();
}

/* Best-effort Firebase sign-out, called alongside the app logout. */
export async function signOutFromFirebase() {
  if (!firebaseAuth) return;
  try {
    await signOut(firebaseAuth);
  } catch {
    /* ignore — local session is already being cleared */
  }
}
