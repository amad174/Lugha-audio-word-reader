import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { AppUser, Organization } from '../types';
import { mapFirebaseUser, logOut, getOrganization } from '../services/authService';

interface AuthContextValue {
  user: AppUser | null;
  org: Organization | null;
  loading: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrg = useCallback(async (orgId: string) => {
    const o = await getOrganization(orgId);
    setOrg(o);
  }, []);

  const refreshUser = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      setUser(null);
      setOrg(null);
      return;
    }
    const appUser = await mapFirebaseUser(fbUser);
    setUser(appUser);
    if (appUser?.orgId) await loadOrg(appUser.orgId);
  }, [loadOrg]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (!fbUser) {
        setUser(null);
        setOrg(null);
        setLoading(false);
        return;
      }
      try {
        const appUser = await mapFirebaseUser(fbUser);
        setUser(appUser);
        if (appUser?.orgId) await loadOrg(appUser.orgId);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [loadOrg]);

  const signOut = useCallback(async () => {
    await logOut();
    setUser(null);
    setOrg(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      org,
      loading,
      isTeacher: user?.role === 'teacher',
      isStudent: user?.role === 'student',
      refreshUser,
      signOut,
    }),
    [user, org, loading, refreshUser, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
