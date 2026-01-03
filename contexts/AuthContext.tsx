
/**
 * Authentication Context with Supabase
 *
 * Provides authentication state and methods throughout the app.
 * Supports:
 * - Email/password authentication
 * - Session management with persistence
 * - User state with public.users table sync
 * - Automatic session restoration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from '@supabase/supabase-js';

interface PublicUser {
  id: string;
  user_id: string;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  publicUser: PublicUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const didInitialize = useRef(false);

  // Fetch public.users row for current user
  const fetchPublicUser = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If user doesn't exist in public.users, create it
        if (error.code === 'PGRST116') {
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({ user_id: userId, role: 'free' })
            .select()
            .single();

          if (!insertError && newUser) {
            setPublicUser(newUser);
          } else {
            console.warn('Failed to create public user record:', insertError);
          }
        } else {
          console.warn('Error fetching public user:', error);
        }
      } else if (data) {
        setPublicUser(data);
      }
    } catch (err) {
      console.warn('Unexpected error fetching public user:', err);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    const initializeAuth = async () => {
      try {
        // Guard: Ensure supabase.auth exists before calling getSession
        if (!supabase?.auth) {
          console.error('Supabase auth not initialized');
          setInitialized(true);
          return;
        }

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Error getting session:', error);
        } else if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchPublicUser(currentSession.user.id);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setInitialized(true);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchPublicUser(currentSession.user.id);
      } else {
        setPublicUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPublicUser]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      if (data.user) {
        await fetchPublicUser(data.user.id);
      }
    } catch (error) {
      console.error("Email sign in failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      
      // Create public.users record (non-blocking)
      if (data.user) {
        await fetchPublicUser(data.user.id);
      }
    } catch (error) {
      console.error("Email sign up failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setPublicUser(null);
      setSession(null);
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (user) {
      await fetchPublicUser(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        publicUser,
        session,
        loading,
        initialized,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshUser,
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
