
/**
 * Authentication Context for Safe Space
 *
 * Provides authentication state and methods throughout the app.
 * Uses Supabase Auth for authentication.
 *
 * Features:
 * - Email/password authentication
 * - Social auth (Google, Apple)
 * - Session management with safe restoration
 * - User state management
 * - Safe fallback when provider is missing
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Safely restore session on mount with timeout to prevent blocking
  useEffect(() => {
    let mounted = true;
    
    const restoreSession = async () => {
      try {
        console.log('[Auth] Restoring session...');
        
        // Race between session fetch and timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session restore timeout')), 3000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (!mounted) return;

        if (error) {
          console.log('[Auth] ⚠️ Session restore error (using null):', error.message);
          setUser(null);
          setSession(null);
        } else if (data?.session) {
          console.log('[Auth] ✅ Session restored successfully');
          setSession(data.session);
          setUser(data.session.user);
        } else {
          console.log('[Auth] ℹ️ No session found');
          setUser(null);
          setSession(null);
        }
      } catch (error: any) {
        if (!mounted) return;
        console.log('[Auth] ⚠️ Session restore failed (using null):', error?.message || 'Unknown error');
        setUser(null);
        setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('[Auth] ✅ Auth initialization complete');
        }
      }
    };

    restoreSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      console.log('[Auth] Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('[Auth] ⚠️ Fetch user error:', error.message);
        setUser(null);
        setSession(null);
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error: any) {
      console.log('[Auth] ⚠️ Fetch user failed:', error?.message || 'Unknown error');
      setUser(null);
      setSession(null);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);
    } catch (error) {
      console.error('[Auth] ❌ Email sign in failed:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);
    } catch (error) {
      console.error('[Auth] ❌ Email sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('[Auth] ❌ Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
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
 * Returns safe fallback if used outside provider (prevents crashes)
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Safe fallback - log warning but don't crash
    console.warn("⚠️ useAuth called outside AuthProvider - returning safe fallback");
    return {
      user: null,
      session: null,
      loading: false,
      signInWithEmail: async () => {
        console.warn("signInWithEmail called but AuthProvider not mounted");
        throw new Error("Auth not ready");
      },
      signUpWithEmail: async () => {
        console.warn("signUpWithEmail called but AuthProvider not mounted");
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
  return context;
}

/**
 * Export a function to check if AuthProvider is mounted
 * Used by dev tools and health checks
 */
export function isAuthProviderMounted(): boolean {
  try {
    const context = useContext(AuthContext);
    return context !== undefined;
  } catch {
    return false;
  }
}
