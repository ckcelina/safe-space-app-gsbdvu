
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
      
      const { data, error } = await supabase
        .from('users')
        .select('ai_tone_id, ai_science_mode')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[UserPreferences] Error fetching preferences:', error);
        // Use defaults on error
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
        setPreferences({
          ai_tone_id: DEFAULT_TONE_ID,
          ai_science_mode: false,
        });
      }
    } catch (err) {
      console.error('[UserPreferences] Unexpected error:', err);
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
      console.error('[UserPreferences] Cannot update: no userId');
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[UserPreferences] Updating preferences:', patch);
      
      const { error } = await supabase
        .from('users')
        .update(patch)
        .eq('id', userId);

      if (error) {
        console.error('[UserPreferences] Update error:', error);
        return { success: false, error: error.message };
      }

      // Update local state
      setPreferences((prev) => ({ ...prev, ...patch }));
      console.log('[UserPreferences] Preferences updated successfully');
      return { success: true };
    } catch (err: any) {
      console.error('[UserPreferences] Unexpected update error:', err);
      return { success: false, error: err?.message || 'Failed to update preferences' };
    }
  }, [userId]);

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
