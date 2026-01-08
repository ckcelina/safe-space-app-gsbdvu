
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface UserPreferences {
  therapist_persona_id: string;
  conversation_style?: string;
  stress_response?: string;
  processing_style?: string;
  decision_style?: string;
  ai_science_mode?: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    therapist_persona_id: 'dr_elias',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, ...updates });

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  };

  const refreshPreferences = async () => {
    await fetchPreferences();
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, loading, updatePreferences, refreshPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}
