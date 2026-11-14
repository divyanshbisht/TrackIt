import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSettingsStore } from './useSettingsStore';

const AUTH_STORAGE_KEY = 'TRACKIT_AUTH_SESSION';

function getAuthClient() {
  const baseUrl = useSettingsStore.getState().apiBaseUrl || 'http://localhost:5000';
  return axios.create({
    baseURL: baseUrl,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  continueAsGuest: () => {
    set({ isGuest: true });
  },

  loadAuthSession: async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.token && parsed.user) {
          set({
            user: parsed.user,
            token: parsed.token,
            isAuthenticated: true,
            isInitialized: true,
          });
          return;
        }
      }
      set({ isInitialized: true });
    } catch (err) {
      console.error('Failed to load auth session:', err);
      set({ isInitialized: true });
    }
  },

  sendSignupOTP: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const client = getAuthClient();
      const res = await client.post('/api/auth/send-otp', {
        email: email.trim(),
        type: 'SIGNUP',
      });
      set({ isLoading: false });
      return { success: true, devOtp: res.data?.devOtp, message: res.data?.message };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to send OTP verification code.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  verifyOTPAndSignup: async ({ name, email, password, otp }) => {
    set({ isLoading: true, error: null });
    try {
      const client = getAuthClient();
      const res = await client.post('/api/auth/verify-otp-and-signup', {
        name: name.trim(),
        email: email.trim(),
        password,
        otp: String(otp).trim(),
      });

      if (res.data && res.data.success) {
        const sessionData = {
          user: res.data.user,
          token: res.data.token,
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
        set({
          user: res.data.user,
          token: res.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user: res.data.user };
      }
      throw new Error('Verification failed.');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Verification failed.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const client = getAuthClient();
      const res = await client.post('/api/auth/login', {
        email: email.trim(),
        password,
      });

      if (res.data && res.data.success) {
        const sessionData = {
          user: res.data.user,
          token: res.data.token,
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
        set({
          user: res.data.user,
          token: res.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user: res.data.user };
      }
      throw new Error('Login failed.');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Invalid email or password.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isGuest: false,
        error: null,
      });
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
