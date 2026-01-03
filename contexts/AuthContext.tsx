
/**
 * Authentication Context for Supabase
 *
 * Enhanced with:
 * - Network error handling (no sign-out on network failures)
 * - Timeout handling for auth operations
 * - User-friendly error messages
 * - Supabase configuration validation
 * - Automatic user profile creation
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// User type
interface User {
  id: string;
  email: string;
  role?: string;
  isPremium?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userId: string | null;
  role: string | null;
  isPremium: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Timeout wrapper for async operations
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  operation: string = 'Operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Check if error is a network/connection issue (not auth failure)
 */
function isNetworkError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  const errorString = String(error).toLowerCase();
  
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('offline') ||
    message.includes('failed to fetch') ||
    errorString.includes('network request failed') ||
    errorString.includes('authretryablefetcherror')
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount with retry
  useEffect(() => {
    fetchUserWithRetry();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await loadUserProfile(session.user);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUserWithRetry = async (retryCount = 0) => {
    try {
      await fetchUser();
    } catch (error) {
      // Retry once after 1 second if network error
      if (retryCount === 0 && isNetworkError(error)) {
        console.log('[Auth] Retrying session fetch after network error...');
        setTimeout(() => fetchUserWithRetry(1), 1000);
      } else {
        // Don't block app startup on auth errors
        console.log('[Auth] Session fetch failed, continuing without user');
        setLoading(false);
      }
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);

      // Check Supabase configuration first
      if (!isSupabaseConfigured()) {
        const configError = getSupabaseConfigError();
        if (__DEV__) {
          console.warn('[Auth] Supabase not configured:', configError);
        }
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Fetch session with timeout
      const sessionPromise = supabase.auth.getSession();
      const { data: { session }, error: sessionError } = await withTimeout(
        sessionPromise,
        10000,
        'Fetch session'
      );

      if (sessionError) {
        console.error('[Auth] Session error:', sessionError);
        
        // Don't sign out on network errors
        if (!isNetworkError(sessionError)) {
          setCurrentUser(null);
        }
        setLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setCurrentUser(null);
      }
    } catch (error: any) {
      console.error('[Auth] Failed to fetch user:', error.message);
      
      // IMPORTANT: Don't sign out on network errors
      if (!isNetworkError(error)) {
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Fetch user profile with timeout
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const { data: profile, error: profileError } = await withTimeout(
        profilePromise,
        10000,
        'Fetch user profile'
      );

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('[Auth] Profile fetch error:', profileError);
      }

      // If profile doesn't exist, create it
      if (!profile) {
        console.log('[Auth] Creating user profile...');
        
        const insertPromise = supabase
          .from('users')
          .insert([{
            id: authUser.id,
            email: authUser.email,
            role: 'free',
          }]);

        const { error: insertError } = await withTimeout(
          insertPromise,
          10000,
          'Create user profile'
        );

        if (insertError && insertError.code !== '23505') {
          console.warn('[Auth] Failed to create profile:', insertError);
        }

        // Set user with default role
        setCurrentUser({
          id: authUser.id,
          email: authUser.email || '',
          role: 'free',
          isPremium: false,
        });
      } else {
        // Set user with profile data
        setCurrentUser({
          id: authUser.id,
          email: authUser.email || '',
          role: profile.role || 'free',
          isPremium: profile.role === 'premium' || profile.role === 'admin',
        });
      }
    } catch (error) {
      console.warn('[Auth] Exception loading profile:', error);
      
      // Set basic user info even if profile fails
      setCurrentUser({
        id: authUser.id,
        email: authUser.email || '',
        role: 'free',
        isPremium: false,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    // Validate Supabase configuration
    if (!isSupabaseConfigured()) {
      const configError = getSupabaseConfigError();
      throw new Error(
        configError || 'Supabase not configured. Please contact support.'
      );
    }

    // Sign in with timeout
    const signInPromise = supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    const { data, error } = await withTimeout(
      signInPromise,
      15000,
      'Sign in'
    );

    if (error) {
      console.error('[Auth] Sign in error:', error);
      
      // Show user-friendly error message
      if (isNetworkError(error)) {
        throw new Error('Connection issue. Please check your internet and try again.');
      }
      
      throw error;
    }

    if (data.user) {
      await loadUserProfile(data.user);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    // Validate Supabase configuration
    if (!isSupabaseConfigured()) {
      const configError = getSupabaseConfigError();
      throw new Error(
        configError || 'Supabase not configured. Please contact support.'
      );
    }

    // Sign up with timeout
    const signUpPromise = supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name,
        },
      },
    });

    const { data, error } = await withTimeout(
      signUpPromise,
      15000,
      'Sign up'
    );

    if (error) {
      console.error('[Auth] Sign up error:', error);
      
      if (isNetworkError(error)) {
        throw new Error('Connection issue. Please check your internet and try again.');
      }
      
      throw error;
    }

    if (data.user) {
      await loadUserProfile(data.user);
    }
  };

  const signOut = async () => {
    try {
      const signOutPromise = supabase.auth.signOut();
      await withTimeout(signOutPromise, 10000, 'Sign out');
      setCurrentUser(null);
    } catch (error: any) {
      console.error('[Auth] Sign out failed:', error.message);
      
      // Clear user state even if sign out fails
      setCurrentUser(null);
      
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userId: currentUser?.id || null,
        role: currentUser?.role || null,
        isPremium: currentUser?.isPremium || false,
        loading,
        signIn,
        signUp,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
