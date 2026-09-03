import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserState {
  username?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email: string;
  countryId?: string | null;
  currencyId?: string | null;
  role: 'ADMIN' | 'CUSTOMER';
}

interface AuthState {
  user: UserState | null;
  token: string | null;
  setAuth: (user: UserState, token: string) => void;
  clearAuth: () => void;
  updateUser: (updatedFields: Partial<UserState>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
    }),
    {
      name: 'nexpo_auth_store', // LocalStorage key name
    }
  )
);
