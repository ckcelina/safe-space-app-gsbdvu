
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { UserPreferencesContext } from '@/contexts/UserPreferencesContext';
import { DEFAULT_TONE_ID } from '@/constants/AITones';

// Default theme for fallback
const defaultTheme = {
  primary: '#1890FF',
  primaryGradient: ['#0050B3', '#40A9FF'] as [string, string],
  gradientColors: ['#0050B3', '#40A9FF'] as [string, string],
  background: '#E6F7FF',
  card: '#FFFFFF',
  textPrimary: '#001529',
  textSecondary: '#595959',
  buttonText: '#FFFFFF',
  buttonBackground: '#1890FF',
  statusBarGradient: ['#F0F9FF', '#E6F7FF'] as [string, string],
};

/**
 * Safe Auth Hook
 * Returns safe defaults if AuthContext is not available
 * Prevents app crashes due to missing AuthProvider
 */
export const useAuthSafe = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('⚠️ AuthContext not found, using safe defaults');
    return {
      user: null,
      userId: null,
      currentUser: null,
      email: null,
      role: null,
      isPremium: false,
      loading: true,
      session: null,
      signInWithEmail: async () => { 
        throw new Error("Auth not ready"); 
      },
      signUpWithEmail: async () => { 
        throw new Error("Auth not ready"); 
      },
      signOut: async () => {},
      fetchUser: async () => {},
    };
  }
  return context;
};

/**
 * Safe Theme Hook
 * Returns default theme if ThemeContext is not available
 * Prevents app crashes due to missing ThemeProvider
 */
export const useThemeSafe = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn('⚠️ ThemeContext not found, using safe defaults');
    return {
      theme: defaultTheme,
      themeKey: 'OceanBlue' as const,
      setTheme: async () => {},
    };
  }
  return context;
};

/**
 * Safe User Preferences Hook
 * Returns safe defaults if UserPreferencesContext is not available
 * Prevents app crashes due to missing UserPreferencesProvider
 */
export const useUserPreferencesSafe = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    console.warn('⚠️ UserPreferencesContext not found, using safe defaults');
    return {
      preferences: {
        ai_tone_id: DEFAULT_TONE_ID,
        ai_science_mode: false,
      },
      loading: false,
      updatePreferences: async () => ({ 
        success: false, 
        error: 'Preferences not ready' 
      }),
      refreshPreferences: async () => {},
    };
  }
  return context;
};
