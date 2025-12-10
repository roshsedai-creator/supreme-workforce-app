import { create } from 'zustand';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: string;
  job_title: string;
  site_id?: string;
  award_level: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user, token) => {
    console.log('[AuthStore] Setting user:', user.first_name, user.role);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    console.log('[AuthStore] Logging out');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
