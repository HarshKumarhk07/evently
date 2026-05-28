import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api.js';
import { tokenStore } from '../lib/axios.js';
import { signInWithGoogle, signOutFromFirebase } from '../lib/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Restore the session on first load when a token is present. */
  useEffect(() => {
    let active = true;
    (async () => {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (active) setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user: u } = await authApi.login(credentials);
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user: u } = await authApi.register(payload);
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  /* Firebase Google flow:
       1. Pop the Google chooser → get a Firebase ID token
       2. Exchange it on our backend for the same JWT email users get
       3. From here the session is identical to any other login */
  const loginWithGoogle = useCallback(async () => {
    const idToken = await signInWithGoogle();
    const { token, user: u } = await authApi.google(idToken);
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* best-effort — clear locally regardless */
    }
    /* Make sure the Firebase session is also cleared so the next Google
       sign-in shows the account chooser. */
    await signOutFromFirebase();
    tokenStore.clear();
    setUser(null);
  }, []);

  /* Merge partial updates (profile edits, favorites) into the cached user. */
  const patchUser = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    /* True only when the manager has been fully approved by an admin — used
       to gate access to listing-management UI. */
    isApprovedManager:
      user?.role === 'manager' && user?.managerProfile?.status === 'approved',
    login,
    register,
    loginWithGoogle,
    logout,
    patchUser,
    /* Lets pages refresh the cached user after state-changing flows
       (e.g. after verifying email or being approved). */
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
