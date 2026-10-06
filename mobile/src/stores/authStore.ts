import axios from 'axios';
import { create } from 'zustand';
import { storage } from '../services/storage';
import { api, getApiBaseUrl, onUnauthorized } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginDemo: () => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await storage.getItem('access_token');
      const refreshToken = await storage.getItem('refresh_token');

      if (!token && !refreshToken) {
        set({ isAuthenticated: false, user: null, token: null, isLoading: false });
        return;
      }

      // 1. Try validating existing access token
      if (token) {
        try {
          const res = await api.get('/auth/me');
          const freshUser = res.data.data;
          await storage.setItem('user', JSON.stringify(freshUser));
          set({
            user: freshUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch {
          // Access token invalid/expired, proceed to refresh token
        }
      }

      // 2. Try refresh token if available
      if (refreshToken) {
        try {
          const baseUrl = getApiBaseUrl();
          const refRes = await axios.post(`${baseUrl}/auth/refresh`, { refreshToken });
          const newAccessToken =
            refRes.data?.data?.tokens?.accessToken || refRes.data?.data?.accessToken;
          const newRefreshToken =
            refRes.data?.data?.tokens?.refreshToken || refRes.data?.data?.refreshToken;

          if (newAccessToken) {
            await storage.setItem('access_token', newAccessToken);
            if (newRefreshToken) {
              await storage.setItem('refresh_token', newRefreshToken);
            }

            const profileRes = await axios.get(`${baseUrl}/auth/me`, {
              headers: { Authorization: `Bearer ${newAccessToken}` },
            });
            const freshUser = profileRes.data.data;
            await storage.setItem('user', JSON.stringify(freshUser));

            set({
              user: freshUser,
              token: newAccessToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        } catch {
          // Refresh token invalid or expired
        }
      }

      // 3. If neither token nor refresh succeeded, reset cleanly
      await storage.removeItem('access_token');
      await storage.removeItem('refresh_token');
      await storage.removeItem('user');
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
    } catch {
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const payload = res.data.data;
      const user = payload.user;
      const accessToken = payload.tokens?.accessToken || payload.accessToken;
      const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;

      if (!accessToken) {
        throw new Error('Access token tidak valid');
      }

      await storage.setItem('access_token', accessToken);
      if (refreshToken) {
        await storage.setItem('refresh_token', refreshToken);
      }
      await storage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login gagal, periksa email & kata sandi';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, isLoading: false });
      return false;
    }
  },

  loginDemo: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', {
        email: 'demo@myfinance.app',
        password: 'password123',
      });
      const payload = res.data.data;
      const user = payload.user;
      const accessToken = payload.tokens?.accessToken || payload.accessToken;
      const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;

      if (!accessToken) {
        throw new Error('Access token akun demo tidak valid');
      }

      await storage.setItem('access_token', accessToken);
      if (refreshToken) {
        await storage.setItem('refresh_token', refreshToken);
      }
      await storage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal login akun demo. Pastikan backend aktif.';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name: name.trim(), email: email.trim(), password });
      const payload = res.data.data;
      const user = payload.user;
      const accessToken = payload.tokens?.accessToken || payload.accessToken;
      const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;

      if (!accessToken) {
        throw new Error('Access token registrasi tidak valid');
      }

      await storage.setItem('access_token', accessToken);
      if (refreshToken) {
        await storage.setItem('refresh_token', refreshToken);
      }
      await storage.setItem('user', JSON.stringify(user));
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registrasi gagal';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      await storage.removeItem('access_token');
      await storage.removeItem('refresh_token');
      await storage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

// Automatically reset auth store when api triggers unauthorized event
onUnauthorized(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });
});

