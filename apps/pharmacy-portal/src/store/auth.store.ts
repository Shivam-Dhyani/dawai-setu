import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Pharmacy {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  pharmacy: Pharmacy | null;
  setAuth: (token: string, pharmacy: Pharmacy) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      pharmacy: null,
      setAuth: (token, pharmacy) => set({ token, pharmacy }),
      clearAuth: () => set({ token: null, pharmacy: null }),
    }),
    { name: 'pharmacy-auth' },
  ),
);
