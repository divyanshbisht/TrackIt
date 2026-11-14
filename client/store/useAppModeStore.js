import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_MODES = {
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE',
  SMART_AI: 'SMART_AI',
};

const STORAGE_KEY = 'TRACKIT_APP_MODE';

export const useAppModeStore = create((set, get) => ({
  mode: APP_MODES.OFFLINE,
  isInitialized: false,

  setMode: async (newMode) => {
    try {
      set({ mode: newMode });
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to persist app mode:', error);
    }
  },

  loadSavedMode: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && Object.values(APP_MODES).includes(saved)) {
        set({ mode: saved, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to load saved app mode:', error);
      set({ isInitialized: true });
    }
  },
}));
