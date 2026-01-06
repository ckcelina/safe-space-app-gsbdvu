
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserPreferences {
  therapistPersonaId: string;
  aiToneId: string;
  aiScienceMode: boolean;
  notificationsEnabled: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
  loading: boolean;
}

const defaultPreferences: UserPreferences = {
  therapistPersonaId: 'dr_elias',
  aiToneId: 'balanced',
  aiScienceMode: false,
  notificationsEnabled: true,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const PREFERENCES_STORAGE_KEY = '@safe_space_preferences';

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (saved) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    try {
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save preference:', error);
    }
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreference, loading }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    // Return safe defaults if provider not mounted
    return {
      preferences: defaultPreferences,
      updatePreference: async () => {},
      loading: false,
    };
  }
  return context;
}
