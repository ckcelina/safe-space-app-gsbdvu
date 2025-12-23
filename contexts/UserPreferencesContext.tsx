
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_TONE_ID } from '@/constants/AITones';

interface UserPreferences {
  ai_tone_id: string;
  ai_science_mode: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
  refreshPreferences: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { userId, currentUser } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    ai_tone_id: DEFAULT_TONE_ID,
    ai_science_mode: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      console.log('[UserPreferences] No userId, using defaults');
      setPreferences({
        ai_tone_id: DEFAULT_TONE_ID,
        ai_science_mode: false,
      });
      setLoading(false);
      return;
    }

    try {
      console.log('[UserPreferences] Fetching preferences for user:', userId);
      
      // Fetch from user_preferences table instead of users table
      const { data, error } = await supabase
        .from('user_preferences')
        .select('ai_tone_id, ai_science_mode')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.log('[UserPreferences] Error fetching preferences (using defaults):', error.message);
        // Use defaults on error - do not crash
        setPreferences({
          ai_tone_id: DEFAULT_TONE_ID,
          ai_science_mode: false,
        });
      } else if (data) {
        console.log('[UserPreferences] Preferences loaded:', data);
        setPreferences({
          ai_tone_id: data.ai_tone_id || DEFAULT_TONE_ID,
          ai_science_mode: data.ai_science_mode ?? false,
        });
      } else {
        console.log('[UserPreferences] No preferences found, using defaults');
        // No row exists yet - use defaults
        setPreferences({
          ai_tone_id: DEFAULT_TONE_ID,
          ai_science_mode: false,
        });
      }
    } catch (err) {
      console.log('[UserPreferences] Unexpected error (using defaults):', err);
      // Use defaults on any error - do not crash
      setPreferences({
        ai_tone_id: DEFAULT_TONE_ID,
        ai_science_mode: false,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (currentUser) {
      fetchPreferences();
    } else {
      setLoading(false);
    }
  }, [currentUser, fetchPreferences]);

  const updatePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    if (!userId) {
      console.log('[UserPreferences] Cannot update: no userId');
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[UserPreferences] Updating preferences:', patch);
      
      // Upsert to user_preferences table with user_id
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            ai_tone_id: patch.ai_tone_id ?? preferences.ai_tone_id,
            ai_science_mode: patch.ai_science_mode ?? preferences.ai_science_mode,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.log('[UserPreferences] Update error:', error.message);
        return { success: false, error: error.message };
      }

      // Update local state
      setPreferences((prev) => ({ ...prev, ...patch }));
      console.log('[UserPreferences] Preferences updated successfully');
      return { success: true };
    } catch (err: any) {
      console.log('[UserPreferences] Unexpected update error:', err);
      return { success: false, error: err?.message || 'Failed to update preferences' };
    }
  }, [userId, preferences]);

  const refreshPreferences = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

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

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
