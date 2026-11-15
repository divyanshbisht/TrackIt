import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'TRACKIT_SETTINGS';
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const useSettingsStore = create((set, get) => ({
  isRestTimerEnabled: true,
  defaultRestDuration: 90, // seconds
  apiBaseUrl: DEFAULT_API_URL,
  isLoaded: false,

  toggleRestTimer: async () => {
    const next = !get().isRestTimerEnabled;
    set({ isRestTimerEnabled: next });
    get().saveSettings();
  },

  setDefaultRestDuration: async (duration) => {
    const clamped = Math.max(15, Math.min(600, duration));
    set({ defaultRestDuration: clamped });
    get().saveSettings();
  },

  setApiBaseUrl: async (url) => {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    set({ apiBaseUrl: cleanUrl });
    get().saveSettings();
  },

  saveSettings: async () => {
    try {
      const state = get();
      const payload = {
        isRestTimerEnabled: state.isRestTimerEnabled,
        defaultRestDuration: state.defaultRestDuration,
        apiBaseUrl: state.apiBaseUrl,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          isRestTimerEnabled: parsed.isRestTimerEnabled !== undefined ? parsed.isRestTimerEnabled : true,
          defaultRestDuration: parsed.defaultRestDuration || 90,
          apiBaseUrl:
            DEFAULT_API_URL && DEFAULT_API_URL !== 'http://localhost:5000'
              ? DEFAULT_API_URL
              : parsed.apiBaseUrl || DEFAULT_API_URL,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoaded: true });
    }
  },
}));
