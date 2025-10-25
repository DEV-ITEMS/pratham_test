import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { storage } from '../lib/utils/storage';

const AuthContext = createContext(undefined);

const DEFAULT_ORG_ID = 'org1';
const LS_USERS = 'auth.users';
const LS_CURRENT = 'auth.currentUser';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [seatUsage, setSeatUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadWorkspaceFor = useCallback(async (activeUser) => {
    if (!activeUser) {
      setUser(null);
      setOrg(null);
      setMembers([]);
      setSeatUsage(null);
      return;
    }
    const orgId = activeUser.orgId || DEFAULT_ORG_ID;
    const [orgData, baseMembers] = await Promise.all([
      apiClient.fetchOrg(orgId),
      apiClient.fetchOrgMembers(orgId),
    ]);
    // Ensure the active user appears in members list (local signups won't be in mocks)
    const mergedMembers = (() => {
      const exists = baseMembers.some((m) => m.email?.toLowerCase() === activeUser.email?.toLowerCase());
      return exists ? baseMembers : [...baseMembers, activeUser];
    })();
    const used = mergedMembers.length;
    const available = Math.max(((orgData?.seatLimit ?? 0) - used), 0);

    setUser(activeUser);
    setOrg(orgData ?? null);
    setMembers(mergedMembers);
    setSeatUsage({ used, available });
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const current = storage.get(LS_CURRENT, null);
        if (!current) {
          setUser(null);
          setOrg(null);
          setMembers([]);
          setSeatUsage(null);
          return;
        }
        await loadWorkspaceFor(current);
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [loadWorkspaceFor]);

  const login = useCallback(async ({ email, password }) => {
    const users = storage.get(LS_USERS, []);
    const found = users.find((u) => u.email?.toLowerCase() === email?.toLowerCase());
    if (!found) {
      throw new Error('No account found for this email');
    }
    if (!password || found.password !== password) {
      throw new Error('Invalid email or password');
    }
    storage.set(LS_CURRENT, found);
    await loadWorkspaceFor(found);
    return found;
  }, [loadWorkspaceFor]);

  const signup = useCallback(async ({ name, email, password }) => {
    if (!name || !email || !password) {
      throw new Error('Please provide name, email and password');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    // Prevent signup using existing demo emails from mocks
    const baseMembers = await apiClient.fetchOrgMembers(DEFAULT_ORG_ID);
    const demoExists = baseMembers.some((m) => m.email?.toLowerCase() === email?.toLowerCase());
    if (demoExists) {
      throw new Error('This email is reserved for demo and cannot be used');
    }
    const users = storage.get(LS_USERS, []);
    const exists = users.some((u) => u.email?.toLowerCase() === email?.toLowerCase());
    if (exists) {
      throw new Error('An account with this email already exists');
    }
    const newUser = {
      id: `user_${Date.now()}`,
      orgId: DEFAULT_ORG_ID,
      name,
      email,
      password,
      role: 'VIEWER',
    };
    const nextUsers = [...users, newUser];
    storage.set(LS_USERS, nextUsers);
    storage.set(LS_CURRENT, newUser);
    await loadWorkspaceFor(newUser);
    return newUser;
  }, [loadWorkspaceFor]);

  const logout = useCallback(async () => {
    storage.remove(LS_CURRENT);
    setUser(null);
    setOrg(null);
    setMembers([]);
    setSeatUsage(null);
  }, []);

  const value = useMemo(
    () => ({ user, org, members, seatUsage, loading, login, signup, logout }),
    [user, org, members, seatUsage, loading, login, signup, logout],
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
