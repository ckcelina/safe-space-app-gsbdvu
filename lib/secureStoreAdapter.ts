/**
 * SecureStore Adapter for Supabase Auth
 *
 * Provides secure, encrypted storage for Supabase sessions on mobile devices.
 * Uses Expo SecureStore which encrypts data using:
 * - iOS: Keychain Services
 * - Android: EncryptedSharedPreferences (KeyStore)
 *
 * This is more secure than AsyncStorage for storing auth tokens.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage adapter that implements Supabase's storage interface
 * Uses SecureStore for actual token storage (encrypted)
 */
export const secureStoreAdapter = {
  /**
   * Get item from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      // SecureStore only works on native platforms
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web
        return localStorage.getItem(key);
      }

      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.warn('[SecureStore] Error getting item:', key, error);
      return null;
    }
  },

  /**
   * Set item in secure storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // SecureStore only works on native platforms
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web
        localStorage.setItem(key, value);
        return;
      }

      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('[SecureStore] Error setting item:', key, error);
    }
  },

  /**
   * Remove item from secure storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      // SecureStore only works on native platforms
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web
        localStorage.removeItem(key);
        return;
      }

      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('[SecureStore] Error removing item:', key, error);
    }
  },
};
