
/**
 * Biometric Lock Context - Safe Implementation
 * Provides biometric authentication state with safe fallbacks
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricLockContextType {
  isEnabled: boolean;
  isLocked: boolean;
  isSupported: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  unlock: () => Promise<boolean>;
  lock: () => void;
}

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

// Create context with safe default
const BiometricLockContext = createContext<BiometricLockContextType>({
  isEnabled: false,
  isLocked: false,
  isSupported: false,
  setEnabled: async () => {
    console.warn('BiometricLockContext: setEnabled called outside provider');
  },
  unlock: async () => {
    console.warn('BiometricLockContext: unlock called outside provider');
    return false;
  },
  lock: () => {
    console.warn('BiometricLockContext: lock called outside provider');
  },
});

export function BiometricLockProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabledState] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    checkSupport();
    loadSettings();
  }, []);

  const checkSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsSupported(compatible && enrolled);
    } catch (error) {
      console.warn('BiometricLockContext: Failed to check support', error);
      setIsSupported(false);
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      if (saved === 'true') {
        setIsEnabledState(true);
        setIsLocked(true);
      }
    } catch (error) {
      console.warn('BiometricLockContext: Failed to load settings', error);
    }
  };

  const setEnabled = async (enabled: boolean) => {
    try {
      setIsEnabledState(enabled);
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
      if (enabled) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.warn('BiometricLockContext: Failed to save settings', error);
    }
  };

  const unlock = async (): Promise<boolean> => {
    if (!isEnabled || !isSupported) {
      setIsLocked(false);
      return true;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Safe Space',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('BiometricLockContext: Authentication failed', error);
      return false;
    }
  };

  const lock = () => {
    if (isEnabled) {
      setIsLocked(true);
    }
  };

  return (
    <BiometricLockContext.Provider
      value={{
        isEnabled,
        isLocked,
        isSupported,
        setEnabled,
        unlock,
        lock,
      }}
    >
      {children}
    </BiometricLockContext.Provider>
  );
}

/**
 * Safe hook - never throws
 */
export function useBiometricLock() {
  const context = useContext(BiometricLockContext);
  if (!context) {
    console.warn('useBiometricLock: Used outside provider, returning defaults');
    return {
      isEnabled: false,
      isLocked: false,
      isSupported: false,
      setEnabled: async () => {},
      unlock: async () => true,
      lock: () => {},
    };
  }
  return context;
}
