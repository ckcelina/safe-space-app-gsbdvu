
/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app.
 * Supports:
 * - Supabase authentication
 * - Session management
 * - User state
 * - Null-safe initialization
 *
 * Usage:
 * 1. Wrap your app with <AuthProvider> in root layout
 * 2. Use useAuth() hook in components to access auth methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current session on mount
  useEffect(() => {
    // Null-safe check for Supabase configuration
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured. Auth features will be disabled.');
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setSession(null);
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);
    } catch (error) {
      console.error('Email sign in failed:', error);
      throw error;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);
    } catch (error) {
      console.error('Email sign up failed:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured');
      setUser(null);
      setSession(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not configured');
      return;
    }

    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (error) {
      console.error('Session refresh failed:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
