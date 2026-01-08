
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface UserPreferences {
  // Therapist selection
  therapist_persona_id: string | null;
  
  // AI preferences
  ai_tone_id: string | null;
  ai_science_mode: boolean;
  
  // Personalization
  conversation_style: string | null;
  stress_response: string | null;
  processing_style: string | null;
  decision_style: string | null;
  cultural_context: string | null;
  values_boundaries: string | null;
  recent_changes: string | null;
  
  // Notifications
  notifications_enabled: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const defaultPreferences: UserPreferences = {
  therapist_persona_id: null,
  ai_tone_id: null,
  ai_science_mode: false,
  conversation_style: null,
  stress_response: null,
  processing_style: null,
  decision_style: null,
  cultural_context: null,
  values_boundaries: null,
  recent_changes: null,
  notifications_enabled: true,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadPreferences();
    } else {
      setPreferences(defaultPreferences);
      setLoading(false);
    }
  }, [userId]);

  const loadPreferences = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      console.log('[UserPreferences] Loading preferences for user:', userId);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[UserPreferences] Error loading preferences:', error);
        setPreferences(defaultPreferences);
      } else if (data) {
        console.log('[UserPreferences] Preferences loaded successfully');
        setPreferences({
          therapist_persona_id: data.therapist_persona_id || null,
          ai_tone_id: data.ai_tone_id || null,
          ai_science_mode: data.ai_science_mode || false,
          conversation_style: data.conversation_style || null,
          stress_response: data.stress_response || null,
          processing_style: data.processing_style || null,
          decision_style: data.decision_style || null,
          cultural_context: data.cultural_context || null,
          values_boundaries: data.values_boundaries || null,
          recent_changes: data.recent_changes || null,
          notifications_enabled: data.notifications_enabled !== false,
        });
      } else {
        console.log('[UserPreferences] No preferences found, using defaults');
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('[UserPreferences] Exception loading preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      console.error('[UserPreferences] Cannot update preferences: No user ID');
      return { success: false, error: 'No user ID' };
    }

    try {
      console.log('[UserPreferences] Updating preferences:', updates);

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('[UserPreferences] Error updating preferences:', error);
          return { success: false, error: error.message };
        }
      } else {
        // Insert new preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...updates,
          });

        if (error) {
          console.error('[UserPreferences] Error inserting preferences:', error);
          return { success: false, error: error.message };
        }
      }

      // Update local state
      setPreferences(prev => ({ ...prev, ...updates }));
      console.log('[UserPreferences] Preferences updated successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('[UserPreferences] Exception updating preferences:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences, loading }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextType {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    // Return safe defaults if provider not mounted
    console.warn('[UserPreferences] useUserPreferences called outside provider, returning defaults');
    return {
      preferences: defaultPreferences,
      updatePreferences: async () => ({ success: false, error: 'Provider not mounted' }),
      loading: false,
    };
  }
  return context;
}
