import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/apiClient';

const AuthContext = createContext(undefined);

const DEFAULT_USER_ID = 'user1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [seatUsage, setSeatUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const mockUserOrgId = 'org1';
        const [orgData, memberData, usage] = await Promise.all([
          apiClient.fetchOrg(mockUserOrgId),
          apiClient.fetchOrgMembers(mockUserOrgId),
          apiClient.fetchSeatUsage(mockUserOrgId),
        ]);
        const currentUser = memberData.find((candidate) => candidate.id === DEFAULT_USER_ID) ?? memberData[0] ?? null;
        setUser(currentUser ?? null);
        setOrg(orgData ?? null);
        setMembers(memberData);
        setSeatUsage(usage);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const value = useMemo(() => ({ user, org, members, seatUsage, loading }), [user, org, members, seatUsage, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};
