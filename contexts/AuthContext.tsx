
/**
 * Authentication Context - Safe Implementation
 * Provides authentication state with safe fallbacks
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Create context with safe default
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {
    console.warn('AuthContext: signUp called outside provider');
  },
  signIn: async () => {
    console.warn('AuthContext: signIn called outside provider');
  },
  signOut: async () => {
    console.warn('AuthContext: signOut called outside provider');
  },
  refreshSession: async () => {
    console.warn('AuthContext: refreshSession called outside provider');
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create user profile if signup successful
      if (data.user) {
        await supabase.from('users').insert({
          user_id: data.user.id,
          role: 'free',
        });
      }
    } catch (error) {
      console.error('AuthContext: Sign up failed', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('AuthContext: Sign in failed', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('AuthContext: Sign out failed', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.warn('AuthContext: Failed to refresh session', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Safe hook - never throws, returns safe defaults
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth: Used outside AuthProvider, returning safe defaults');
    return {
      user: null,
      session: null,
      loading: false,
      signUp: async () => {},
      signIn: async () => {},
      signOut: async () => {},
      refreshSession: async () => {},
    };
  }
  return context;
}

/**
 * Hook to check if AuthProvider is mounted
 * Useful for debugging provider issues
 */
export function useIsAuthProviderMounted() {
  const context = useContext(AuthContext);
  return context !== undefined;
}
