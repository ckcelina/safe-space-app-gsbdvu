
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

/**
 * Safe Auth Hook
 * Returns safe defaults if AuthContext is not available
 * Prevents app crashes due to missing AuthProvider
 */
export const useAuthSafe = () => {
  try {
    const context = useAuth();
    return context;
  } catch (error) {
    console.warn('⚠️ AuthContext not found, using safe defaults');
    return {
      user: null,
      session: null,
      loading: false,
      signInWithEmail: async () => { 
        throw new Error("Auth not ready"); 
      },
      signUpWithEmail: async () => { 
        throw new Error("Auth not ready"); 
      },
      signOut: async () => {
        console.warn("signOut called but AuthProvider not mounted");
      },
      fetchUser: async () => {
        console.warn("fetchUser called but AuthProvider not mounted");
      },
    };
  }
};

/**
 * Safe Theme Hook
 * Returns default theme if ThemeContext is not available
 * Prevents app crashes due to missing ThemeProvider
 */
export const useThemeSafe = () => {
  try {
    const context = useThemeContext();
    return context;
  } catch (error) {
    console.warn('⚠️ ThemeContext not found, using safe defaults');
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
    return {
      theme: defaultTheme,
      themeKey: 'OceanBlue' as const,
      setTheme: async () => {
        console.warn("setTheme called but ThemeProvider not mounted");
      },
    };
  }
};

/**
 * Safe User Preferences Hook
 * Returns safe defaults if UserPreferencesContext is not available
 * Prevents app crashes due to missing UserPreferencesProvider
 */
export const useUserPreferencesSafe = () => {
  try {
    const context = useUserPreferences();
    return context;
  } catch (error) {
    console.warn('⚠️ UserPreferencesContext not found, using safe defaults');
    return {
      preferences: {
        ai_tone_id: 'balanced',
        ai_science_mode: false,
      },
      loading: false,
      updatePreferences: async () => ({ 
        success: false, 
        error: 'Preferences not ready' 
      }),
      refreshPreferences: async () => {
        console.warn("refreshPreferences called but UserPreferencesProvider not mounted");
      },
    };
  }
};
