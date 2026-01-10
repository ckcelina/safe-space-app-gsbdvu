
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BiometricLockContextType {
  isBiometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

const BiometricLockContext = createContext<BiometricLockContextType | undefined>(undefined);

export function BiometricLockProvider({ children }: { children: ReactNode }) {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const setBiometricEnabled = async (enabled: boolean) => {
    setIsBiometricEnabled(enabled);
  };

  return (
    <BiometricLockContext.Provider value={{ isBiometricEnabled, setBiometricEnabled }}>
      {children}
    </BiometricLockContext.Provider>
  );
}

export function useBiometricLock() {
  const context = useContext(BiometricLockContext);
  if (!context) {
    throw new Error('useBiometricLock must be used within BiometricLockProvider');
  }
  return context;
}
