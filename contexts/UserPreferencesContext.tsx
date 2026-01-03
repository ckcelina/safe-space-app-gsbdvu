
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_TONE_ID } from '@/constants/AITones';
import { prefetchSelectedAvatar } from '@/lib/avatarPrefetch';

interface UserPreferences {
  ai_tone_id: string;
  ai_science_mode: boolean;
  therapist_persona_id?: string;
  conversation_style?: string;
  stress_response?: string;
  processing_style?: string;
  decision_style?: string;
  cultural_context?: string;
  values_boundaries?: string;
  recent_changes?: string;
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
  const [initialized, setInitialized] = useState(false);

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

    // Wrap in timeout to prevent blocking startup
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Preferences fetch timeout')), 3000)
    );

    try {
      console.log('[UserPreferences] Fetching preferences for user:', userId);
      
      // Race between fetch and timeout
      const fetchPromise = supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const result = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);

      // Type guard to check if result is from Supabase
      if (result && typeof result === 'object' && 'data' in result) {
        const { data, error } = result;

        if (error) {
          console.log('[UserPreferences] Error fetching preferences (using defaults):', error?.message || 'Unknown error');
          // Use defaults on error - do not crash
          setPreferences({
            ai_tone_id: DEFAULT_TONE_ID,
            ai_science_mode: false,
          });
        } else if (data) {
          console.log('[UserPreferences] Preferences loaded');
          const loadedPreferences: UserPreferences = {
            ai_tone_id: data.ai_tone_id || DEFAULT_TONE_ID,
            ai_science_mode: data.ai_science_mode ?? false,
            therapist_persona_id: data.therapist_persona_id || undefined,
            conversation_style: data.conversation_style || undefined,
            stress_response: data.stress_response || undefined,
            processing_style: data.processing_style || undefined,
            decision_style: data.decision_style || undefined,
            cultural_context: data.cultural_context || undefined,
            values_boundaries: data.values_boundaries || undefined,
            recent_changes: data.recent_changes || undefined,
          };
          setPreferences(loadedPreferences);
          
          // Prefetch selected therapist avatar if set
          if (data.therapist_persona_id) {
            console.log('[UserPreferences] Prefetching selected therapist avatar');
            prefetchSelectedAvatar(data.therapist_persona_id).catch((err) => {
              console.warn('[UserPreferences] Avatar prefetch failed (non-critical):', err);
            });
          }
        } else {
          console.log('[UserPreferences] No preferences found, using defaults');
          // No row exists yet - use defaults
          setPreferences({
            ai_tone_id: DEFAULT_TONE_ID,
            ai_science_mode: false,
          });
        }
      }
    } catch (err: any) {
      console.log('[UserPreferences] Unexpected error (using defaults):', err?.message || 'Unknown error');
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
    // Move fetch into useEffect to prevent blocking initial render
    if (currentUser && !initialized) {
      setInitialized(true);
      fetchPreferences();
    } else if (!currentUser) {
      setLoading(false);
    }
  }, [currentUser, initialized, fetchPreferences]);

  const updatePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    if (!userId) {
      console.log('[UserPreferences] Cannot update: no userId');
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[UserPreferences] Updating preferences');
      
      // Upsert to user_preferences table with user_id
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            ai_tone_id: patch.ai_tone_id ?? preferences.ai_tone_id,
            ai_science_mode: patch.ai_science_mode ?? preferences.ai_science_mode,
            therapist_persona_id: patch.therapist_persona_id !== undefined ? patch.therapist_persona_id : preferences.therapist_persona_id,
            conversation_style: patch.conversation_style !== undefined ? patch.conversation_style : preferences.conversation_style,
            stress_response: patch.stress_response !== undefined ? patch.stress_response : preferences.stress_response,
            processing_style: patch.processing_style !== undefined ? patch.processing_style : preferences.processing_style,
            decision_style: patch.decision_style !== undefined ? patch.decision_style : preferences.decision_style,
            cultural_context: patch.cultural_context !== undefined ? patch.cultural_context : preferences.cultural_context,
            values_boundaries: patch.values_boundaries !== undefined ? patch.values_boundaries : preferences.values_boundaries,
            recent_changes: patch.recent_changes !== undefined ? patch.recent_changes : preferences.recent_changes,
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
      
      // Prefetch new therapist avatar if persona changed
      if (patch.therapist_persona_id && patch.therapist_persona_id !== preferences.therapist_persona_id) {
        console.log('[UserPreferences] Therapist persona changed, prefetching new avatar');
        prefetchSelectedAvatar(patch.therapist_persona_id).catch((err) => {
          console.warn('[UserPreferences] Avatar prefetch failed (non-critical):', err);
        });
      }
      
      return { success: true };
    } catch (err: any) {
      console.log('[UserPreferences] Unexpected update error:', err?.message || 'Unknown error');
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
