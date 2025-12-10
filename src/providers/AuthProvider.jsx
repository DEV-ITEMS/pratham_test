import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { storage } from '../lib/utils/storage';

const AuthContext = createContext(undefined);

const LS_TOKEN = 'auth.token';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [seatUsage, setSeatUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    storage.remove(LS_TOKEN);
    setToken(null);
    setUser(null);
    setOrg(null);
    setSeatUsage(null);
  }, []);

  const hydrateSession = useCallback(async (nextToken, session) => {
    if (!nextToken) {
      clearSession();
      return;
    }

    try {
      const base = session ?? (await apiClient.me({ token: nextToken }));
      const orgData = await apiClient.getOrg({ token: nextToken });
      const seat = await apiClient.getSeatUsage({ token: nextToken });

      setToken(nextToken);
      setUser(base.user ?? null);
      setOrg(orgData ?? base.organization ?? null);
      setSeatUsage(seat ?? null);
      storage.set(LS_TOKEN, nextToken);
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [clearSession]);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = storage.get(LS_TOKEN, null);
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        await hydrateSession(storedToken);
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [hydrateSession]);

  const login = useCallback(async ({ email, password }) => {
    const result = await apiClient.login({ email, password });
    await hydrateSession(result.token, result);
    return result.user;
  }, [hydrateSession]);

  const signup = useCallback(async ({ name, email, password }) => {
    const result = await apiClient.signup({ name, email, password });
    await hydrateSession(result.token, result);
    return result.user;
  }, [hydrateSession]);

  const logout = useCallback(async () => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, org, seatUsage, token, loading, login, signup, logout }),
    [user, org, seatUsage, token, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};
