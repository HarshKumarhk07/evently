import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api.js';
import { tokenStore } from '../lib/axios.js';

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

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* best-effort — clear locally regardless */
    }
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
    login,
    register,
    logout,
    patchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
