/**
 * Secure Storage Adapter for Supabase Auth
 *
 * Uses Expo SecureStore to securely persist auth sessions.
 * This prevents users from being logged out on app restart.
 *
 * CRITICAL: Do NOT use AsyncStorage for auth tokens - it's not encrypted!
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Custom storage adapter for Supabase that uses Expo SecureStore
 * This ensures auth sessions are encrypted and persisted securely
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      // SecureStore only works on native platforms
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }

      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error('[SecureStorage] Error getting item:', key, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // SecureStore only works on native platforms
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }

      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('[SecureStorage] Error setting item:', key, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      // SecureStore only works on native platforms
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }

      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('[SecureStorage] Error removing item:', key, error);
    }
  },
};
