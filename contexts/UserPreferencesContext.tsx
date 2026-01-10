
/**
 * User Preferences Context - Safe Implementation
 * Provides user preferences with safe fallbacks
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface UserPreferences {
  therapist_persona_id: string;
  ai_tone_id: string;
  ai_science_mode: boolean;
  conversation_style?: string;
  stress_response?: string;
  processing_style?: string;
  decision_style?: string;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  therapist_persona_id: 'default',
  ai_tone_id: 'balanced',
  ai_science_mode: false,
};

// Create context with safe default
const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: DEFAULT_PREFERENCES,
  loading: false,
  updatePreferences: async () => {
    console.warn('UserPreferencesContext: updatePreferences called outside provider');
  },
  refreshPreferences: async () => {
    console.warn('UserPreferencesContext: refreshPreferences called outside provider');
  },
});

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    if (auth.user?.id) {
      refreshPreferences();
    }
  }, [auth.user?.id]);

  const refreshPreferences = async () => {
    if (!auth.user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', auth.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('UserPreferencesContext: Failed to load preferences', error);
        return;
      }

      if (data) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data });
      }
    } catch (error) {
      console.warn('UserPreferencesContext: Error loading preferences', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!auth.user?.id) {
      console.warn('UserPreferencesContext: Cannot update preferences without user');
      return;
    }

    try {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: auth.user.id,
          ...newPreferences,
        });

      if (error) {
        console.warn('UserPreferencesContext: Failed to save preferences', error);
        // Revert on error
        setPreferences(preferences);
      }
    } catch (error) {
      console.warn('UserPreferencesContext: Error updating preferences', error);
      setPreferences(preferences);
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        loading,
        updatePreferences,
        refreshPreferences,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

/**
 * Safe hook - never throws
 */
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    console.warn('useUserPreferences: Used outside provider, returning defaults');
    return {
      preferences: DEFAULT_PREFERENCES,
      loading: false,
      updatePreferences: async () => {},
      refreshPreferences: async () => {},
    };
  }
  return context;
}
