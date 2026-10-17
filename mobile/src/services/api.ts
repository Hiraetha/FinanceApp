import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';
import Constants from 'expo-constants';

// Base API URL configuration
// Dynamically detects the laptop's IP address when running via Expo Go on physical device (e.g. 192.168.1.132)
export const getApiBaseUrl = (): string => {
  // 0. Environment variable or extra config (for standalone APK / production)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const extraApiUrl = (Constants.expoConfig?.extra as any)?.apiUrl;
  if (extraApiUrl) {
    return extraApiUrl;
  }

  // 1. Try hostUri from expoConfig
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost') return `http://${ip}:3000`;
  }

  // 2. Try expoGoConfig or manifest debuggerHost
  const debuggerHost =
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost') return `http://${ip}:3000`;
  }

  // 3. Try experienceUrl or linkingUri
  const linkingUri = Constants.linkingUri || (Constants as any).experienceUrl;
  if (linkingUri && typeof linkingUri === 'string' && linkingUri.includes('://')) {
    const match = linkingUri.match(/:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost') {
      return `http://${match[1]}:3000`;
    }
  }

  // 4. Default fallback
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Unauthorized event listener system for state stores
type UnauthorizedListener = () => void;
let unauthorizedListeners: UnauthorizedListener[] = [];

export const onUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.push(listener);
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((l) => l !== listener);
  };
};

export const notifyUnauthorized = () => {
  unauthorizedListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignore listener error
    }
  });
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const activeBase = getApiBaseUrl();
      if (!config.baseURL || config.baseURL.includes('localhost') || config.baseURL.includes('192.168.1.132')) {
        config.baseURL = activeBase;
      }
      const token = await storage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Fallback if storage fails
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Concurrency queue for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('Refresh token tidak tersedia');
        }

        const baseUrl = originalRequest.baseURL || getApiBaseUrl();
        const refreshResponse = await axios.post(`${baseUrl}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken =
          refreshResponse.data?.data?.tokens?.accessToken ||
          refreshResponse.data?.data?.accessToken;
        const newRefreshToken =
          refreshResponse.data?.data?.tokens?.refreshToken ||
          refreshResponse.data?.data?.refreshToken;

        if (!newAccessToken) {
          throw new Error('Format token baru tidak valid');
        }

        await storage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          await storage.setItem('refresh_token', newRefreshToken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await storage.removeItem('access_token');
        await storage.removeItem('refresh_token');
        await storage.removeItem('user');
        notifyUnauthorized();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const formatCurrency = (val: string | number | undefined): string => {
  if (val === undefined || val === null) return 'Rp0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 'Rp0';
  return 'Rp' + Math.round(num).toLocaleString('id-ID');
};
