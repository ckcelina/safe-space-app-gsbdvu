
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_lock_enabled';
const BACKGROUND_TIMEOUT = 30000; // 30 seconds

interface BiometricLockContextType {
  isLocked: boolean;
  isBiometricEnabled: boolean;
  isBiometricAvailable: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  authenticate: () => Promise<boolean>;
  unlock: () => void;
}

const BiometricLockContext = createContext<BiometricLockContextType | undefined>(undefined);

export const BiometricLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabledState] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const backgroundTimeRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground
      if (isBiometricEnabled && backgroundTimeRef.current) {
        const timeInBackground = Date.now() - backgroundTimeRef.current;
        if (timeInBackground >= BACKGROUND_TIMEOUT) {
          setIsLocked(true);
          const success = await authenticate();
          if (success) {
            setIsLocked(false);
          }
        }
      }
      backgroundTimeRef.current = null;
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background
      backgroundTimeRef.current = Date.now();
    }
    appState.current = nextAppState;
  }, [isBiometricEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled);
    } catch {
      setIsBiometricAvailable(false);
    }
  };

  const loadBiometricPreference = async () => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabledState(enabled === 'true');
    } catch {
      setIsBiometricEnabledState(false);
    }
  };

  const setBiometricEnabled = async (enabled: boolean) => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    setIsBiometricEnabledState(enabled);
  };

  const authenticate = async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Safe Space',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  };

  const unlock = () => {
    setIsLocked(false);
  };

  return (
    <BiometricLockContext.Provider
      value={{
        isLocked,
        isBiometricEnabled,
        isBiometricAvailable,
        setBiometricEnabled,
        authenticate,
        unlock,
      }}
    >
      {children}
    </BiometricLockContext.Provider>
  );
};

export const useBiometricLock = () => {
  const context = useContext(BiometricLockContext);
  if (!context) {
    throw new Error('useBiometricLock must be used within BiometricLockProvider');
  }
  return context;
};
