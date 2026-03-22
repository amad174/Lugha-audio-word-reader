import { useState, useCallback } from 'react';
import { isAdminSetup, setupAdmin, checkAdmin } from '../utils/storage';

export type AuthState = 'guest' | 'admin';

export function useAuth() {
  const [role, setRole] = useState<AuthState>('guest');
  const [adminExists, setAdminExists] = useState(() => isAdminSetup());

  const loginAdmin = useCallback((password: string): boolean => {
    if (checkAdmin(password)) {
      setRole('admin');
      return true;
    }
    return false;
  }, []);

  const createAdmin = useCallback((password: string) => {
    setupAdmin(password);
    setAdminExists(true);
    setRole('admin');
  }, []);

  const logout = useCallback(() => setRole('guest'), []);

  const isAdmin = role === 'admin';

  return { role, isAdmin, adminExists, loginAdmin, createAdmin, logout };
}
