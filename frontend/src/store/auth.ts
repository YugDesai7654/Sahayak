import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  sahayak_id?: string;
  officer_id?: string;
  admin_id?: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'admin';
  tier?: string;
  jurisdiction?: { state?: string | null; district?: string | null; taluka?: string | null };
  office_name?: string;
  district?: string;
  department?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  lang: 'en' | 'hi';
  isOffline: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  setLang: (lang: 'en' | 'hi') => void;
  setOffline: (offline: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      lang: 'en',
      isOffline: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setLang: (lang) => set({ lang }),
      setOffline: (isOffline) => set({ isOffline }),
    }),
    { name: 'sahayak-auth' }
  )
);
