
/**
 * Authentication Context for Safe Space
 *
 * Provides Supabase authentication state and methods throughout the app.
 * Supports:
 * - Email/password authentication
 * - Session management with Supabase
 * - User profile from public.users table
 * - Automatic session restoration
 *
 * Usage:
 * 1. Wrap your app with <AuthProvider> (already done in app/_layout.tsx)
 * 2. Use useAuth() hook in components to access auth methods
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { User as AppUser } from "@/types/database.types";

interface AuthContextType {
  // Supabase auth user
  currentUser: SupabaseUser | null;
  session: Session | null;
  
  // App user profile from public.users
  userProfile: AppUser | null;
  userId: string | null;
  role: 'free' | 'premium' | 'admin' | null;
  isPremium: boolean;
  
  // Loading states
  loading: boolean;
  
  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const listenerSetup = useRef(false);

  /**
   * Fetch user profile from public.users table
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user profile doesn't exist, create it with default values
        if (error.code === 'PGRST116') {
          console.log('[AuthContext] User profile not found, creating default profile');
          
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert([{
              id: userId,
              role: 'free',
            }])
            .select()
            .single();

          if (insertError) {
            console.error('[AuthContext] Failed to create user profile:', insertError);
            // Don't throw - allow user to continue with null profile
            setUserProfile(null);
            return;
          }

          console.log('[AuthContext] User profile created:', newProfile);
          setUserProfile(newProfile);
        } else {
          console.error('[AuthContext] Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        console.log('[AuthContext] User profile loaded:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('[AuthContext] Unexpected error fetching user profile:', error);
      setUserProfile(null);
    }
  }, []);

  /**
   * Refresh user profile (called after profile updates)
   */
  const refreshUserProfile = useCallback(async () => {
    if (currentUser?.id) {
      await fetchUserProfile(currentUser.id);
    }
  }, [currentUser?.id, fetchUserProfile]);

  // Initialize auth state and set up listener
  useEffect(() => {
    // Prevent duplicate listeners on Fast Refresh
    if (listenerSetup.current) {
      return;
    }
    listenerSetup.current = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('[AuthContext] Initializing auth...');
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Failed to get session:', error);
          setSession(null);
          setCurrentUser(null);
          setUserProfile(null);
        } else if (currentSession) {
          console.log('[AuthContext] Session found:', currentSession.user.id);
          setSession(currentSession);
          setCurrentUser(currentSession.user);
          
          // Fetch user profile
          await fetchUserProfile(currentSession.user.id);
        } else {
          console.log('[AuthContext] No session found');
          setSession(null);
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
        setSession(null);
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[AuthContext] Auth state changed:', event);
        
        setSession(currentSession);
        setCurrentUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Fetch user profile when user signs in
          await fetchUserProfile(currentSession.user.id);
        } else {
          // Clear user profile when user signs out
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
      listenerSetup.current = false;
    };
  }, [fetchUserProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Email sign in failed:', error);
        throw error;
      }

      console.log('[AuthContext] Sign in successful');
      // Session will be updated via onAuthStateChange listener
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing up with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Email sign up failed:', error);
        throw error;
      }

      console.log('[AuthContext] Sign up successful');
      
      // If user is immediately signed in (no email confirmation required)
      if (data.user) {
        // Create user profile
        await fetchUserProfile(data.user.id);
      }
      
      // Session will be updated via onAuthStateChange listener
    } catch (error) {
      console.error('[AuthContext] Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Sign out failed:', error);
        throw error;
      }

      console.log('[AuthContext] Sign out successful');
      // Session will be cleared via onAuthStateChange listener
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      console.log('[AuthContext] Refreshing session...');
      
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AuthContext] Session refresh failed:', error);
        throw error;
      }

      setSession(refreshedSession);
      setCurrentUser(refreshedSession?.user ?? null);
      
      if (refreshedSession?.user) {
        await fetchUserProfile(refreshedSession.user.id);
      }
      
      console.log('[AuthContext] Session refreshed');
    } catch (error) {
      console.error('[AuthContext] Refresh session error:', error);
      throw error;
    }
  };

  // Compute derived values
  const userId = currentUser?.id ?? null;
  const role = userProfile?.role ?? null;
  const isPremium = role === 'premium' || role === 'admin';

  // Show loading screen while auth initializes
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        userProfile,
        userId,
        role,
        isPremium,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshSession,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 * Returns safe fallback if provider not ready
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    // Safe fallback instead of throwing
    console.warn("⚠️ useAuth called outside AuthProvider - returning safe fallback");
    return {
      currentUser: null,
      session: null,
      userProfile: null,
      userId: null,
      role: null,
      isPremium: false,
      loading: true,
      signInWithEmail: async () => {
        console.warn("⚠️ signInWithEmail called outside AuthProvider");
      },
      signUpWithEmail: async () => {
        console.warn("⚠️ signUpWithEmail called outside AuthProvider");
      },
      signOut: async () => {
        console.warn("⚠️ signOut called outside AuthProvider");
      },
      refreshSession: async () => {
        console.warn("⚠️ refreshSession called outside AuthProvider");
      },
      refreshUserProfile: async () => {
        console.warn("⚠️ refreshUserProfile called outside AuthProvider");
      },
    };
  }
  
  return context;
}
