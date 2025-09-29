import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { Org, SeatUsage, User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  org: Org | null;
  members: User[];
  seatUsage: SeatUsage | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_USER_ID = 'user1';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);
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

  const value = useMemo<AuthContextValue>(() => ({ user, org, members, seatUsage, loading }), [user, org, members, seatUsage, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};
