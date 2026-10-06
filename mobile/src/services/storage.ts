import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback in case native storage has issues in Expo Go / development clients
const memoryStore = new Map<string, string>();

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) return val;
      return memoryStore.get(key) ?? null;
    } catch (e) {
      console.warn(`[storage] getItem fallback for "${key}":`, e);
      return memoryStore.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[storage] setItem fallback for "${key}":`, e);
      // Suppress native storage crash so app keeps working seamlessly
    }
  },

  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[storage] removeItem fallback for "${key}":`, e);
    }
  },
};
