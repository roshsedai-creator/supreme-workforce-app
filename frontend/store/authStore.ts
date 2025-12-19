import { create } from 'zustand';

interface Permissions {
  view_home: boolean;
  view_own_timesheets: boolean;
  clock_in_out: boolean;
  view_roster: boolean;
  request_time_off: boolean;
  view_own_pay: boolean;
  view_all_timesheets: boolean;
  edit_timesheets: boolean;
  approve_timesheets: boolean;
  manage_roster: boolean;
  view_reports: boolean;
  manage_users: boolean;
  manage_sites: boolean;
  export_payroll: boolean;
  manage_permissions: boolean;
}

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
  permissions?: Permissions;
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
  setUser: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
