import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isPinterestConnected: boolean;
  userId: string | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  connectPinterest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isPinterestConnected: false,
  userId: null,
  isLoading: true,
  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      
      if (data.authenticated) {
        set({ isAuthenticated: true, userId: data.userId, isPinterestConnected: data.pinterestConnected === true, isLoading: false });
      } else {
        set({ isAuthenticated: false, userId: null, isPinterestConnected: false, isLoading: false });
      }
    } catch (e) {
      set({ isAuthenticated: false, userId: null, isPinterestConnected: false, isLoading: false });
    }
  },
  connectPinterest: () => {
    window.location.href = '/api/pinterest/connect';
  }
}));
