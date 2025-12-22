
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  currentUser: SupabaseUser | null;
  user: UserProfile | null;
  userId: string | null;
  email: string | null;
  role: 'free' | 'premium' | 'admin';
  isPremium: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('[AuthProvider] Component rendering...');
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUserId: string) => {
    try {
      console.log('[AuthContext] Fetching user profile for:', authUserId);
      
      // Step 1: Check if user profile already exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('[AuthContext] Error checking existing user profile:', selectError);
      }

      // Step 2: If user exists, set it and stop
      if (existingUser) {
        console.log('[AuthContext] User profile found:', existingUser);
        setUser(existingUser);
        return;
      }

      // Step 3: User doesn't exist, create one
      console.log('[AuthContext] User profile not found, creating one');
      const { data: authUser } = await supabase.auth.getUser();
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ 
          id: authUserId, 
          email: authUser.user?.email || null,
          role: 'free' 
        }])
        .select()
        .maybeSingle();

      // Step 4: Handle duplicate key error gracefully
      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate key error - this is non-fatal
          console.warn('[AuthContext] Duplicate user profile detected, fetching existing profile.');
          
          // Re-select the existing user profile
          const { data: retryUser, error: retrySelectError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle();

          if (retrySelectError) {
            console.error('[AuthContext] Error fetching existing user profile after duplicate error:', retrySelectError);
            // Set a fallback user object
            setUser({ 
              id: authUserId, 
              email: authUser.user?.email || null,
              username: null,
              role: 'free', 
              created_at: new Date().toISOString() 
            });
          } else if (retryUser) {
            console.log('[AuthContext] Successfully fetched existing user profile:', retryUser);
            setUser(retryUser);
          } else {
            console.warn('[AuthContext] No user found after duplicate error, using fallback');
            setUser({ 
              id: authUserId, 
              email: authUser.user?.email || null,
              username: null,
              role: 'free', 
              created_at: new Date().toISOString() 
            });
          }
        } else {
          // Real error - log it but don't block the user
          console.error('[AuthContext] Error creating user profile:', insertError);
          setUser({ 
            id: authUserId, 
            email: authUser.user?.email || null,
            username: null,
            role: 'free', 
            created_at: new Date().toISOString() 
          });
        }
      } else if (newUser) {
        console.log('[AuthContext] User profile created:', newUser);
        setUser(newUser);
      } else {
        // Fallback if insert returns no data
        setUser({ 
          id: authUserId, 
          email: authUser.user?.email || null,
          username: null,
          role: 'free', 
          created_at: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('[AuthContext] Error in fetchUserProfile:', error);
      // Set a default user object to prevent blocking
      setUser({ 
        id: authUserId, 
        email: null,
        username: null,
        role: 'free', 
        created_at: new Date().toISOString() 
      });
    }
  };

  const refreshUser = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.id);
    }
  };

  // Check if a valid refresh token exists in storage
  const hasValidRefreshToken = async (): Promise<boolean> => {
    try {
      const key = `sb-zjzvkxvahrbuuyzjzxol-auth-token`;
      const storedSession = await AsyncStorage.getItem(key);
      
      if (!storedSession) {
        return false;
      }

      const parsedSession = JSON.parse(storedSession);
      const refreshToken = parsedSession?.refresh_token;
      
      return !!refreshToken;
    } catch (error) {
      // Silent fail - no logging for normal logged-out state
      return false;
    }
  };

  // Safe session refresh that checks for token existence first
  const safeRefreshSession = useCallback(async () => {
    try {
      const hasToken = await hasValidRefreshToken();
      
      if (!hasToken) {
        // No token = logged out state, this is normal
        return;
      }

      console.log('[AuthContext] Attempting to refresh session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AuthContext] Session refresh error:', error);
        // Clear session if refresh fails
        setSession(null);
        setCurrentUser(null);
        setUser(null);
        return;
      }

      if (data.session) {
        console.log('[AuthContext] Session refreshed successfully');
        setSession(data.session);
        setCurrentUser(data.session.user);
        if (data.session.user) {
          await fetchUserProfile(data.session.user.id);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error in safeRefreshSession:', error);
    }
  }, []);

  useEffect(() => {
    console.log('[AuthContext] Initializing...');
    
    // Get initial session with token check
    const initializeAuth = async () => {
      try {
        // First check if we have a refresh token
        const hasToken = await hasValidRefreshToken();
        
        if (!hasToken) {
          // No token found - user is logged out
          // This is a normal state, no error logging needed
          console.log('[AuthContext] No session found, defaulting to logged-out state');
          setLoading(false);
          return;
        }

        // Only attempt to get session if we have a token
        console.log('[AuthContext] Session token found, attempting to restore session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting initial session:', error);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('[AuthContext] Session restored for:', session.user?.email);
          setSession(session);
          setCurrentUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          console.log('[AuthContext] No active session found');
        }
      } catch (error) {
        console.error('[AuthContext] Error in initializeAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthContext] Auth state changed:', _event, session?.user?.email || 'No session');
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Only attempt refresh if we have a refresh token
        const hasToken = await hasValidRefreshToken();
        
        if (hasToken) {
          console.log('[AuthContext] App resumed, refreshing session...');
          await safeRefreshSession();
        }
        // No logging if no token - this is normal logged-out state
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [safeRefreshSession]);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing up user:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed'
        }
      });

      if (error) {
        console.error('[AuthContext] Signup error:', error);
        return { error };
      }

      console.log('[AuthContext] Signup successful:', data.user?.email || 'No email');
      
      // The user profile will be created automatically by fetchUserProfile
      // when the auth state changes to SIGNED_IN
      
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Unexpected signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        return { error };
      }

      console.log('[AuthContext] Sign in successful:', data.user?.email || 'No email');
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Unexpected sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Starting sign out...');
      
      // Clear local state FIRST to ensure UI updates immediately
      setSession(null);
      setCurrentUser(null);
      setUser(null);
      
      console.log('[AuthContext] Local state cleared');
      
      // Then call Supabase sign out (this may take time)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Supabase sign out error:', error);
        // Don't throw - we've already cleared local state
      } else {
        console.log('[AuthContext] Supabase sign out successful');
      }
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      // Even if there's an error, state is already cleared
    }
  };

  // Compute isPremium based on role
  const userRole = user?.role ?? 'free';
  const isPremium = userRole === 'premium' || userRole === 'admin';

  console.log('[AuthProvider] Rendering with loading:', loading, 'session:', !!session);

  return (
    <AuthContext.Provider
      value={{
        session,
        currentUser,
        user,
        userId: currentUser?.id ?? null,
        email: currentUser?.email ?? null,
        role: userRole,
        isPremium,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
