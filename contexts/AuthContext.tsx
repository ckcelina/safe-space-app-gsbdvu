
/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app using Supabase Auth.
 * Supports:
 * - Email/password authentication
 * - Session management
 * - User state with role and premium status
 *
 * Usage:
 * 1. Wrap your app with <AuthProvider>
 * 2. Use useAuth() hook in components to access auth state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// User type from database
interface User {
  id: string;
  email?: string;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}

interface AuthContextType {
  currentUser: SupabaseUser | null;
  user: User | null;
  userId: string | null;
  role: 'free' | 'premium' | 'admin';
  isPremium: boolean;
  loading: boolean;
  isHydrated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchUserProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[AuthContext] Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        // User profile doesn't exist, create it
        console.log('[AuthContext] User profile not found, creating one...');
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authUser.id,
            email: authUser.email,
            role: 'free',
          }])
          .select()
          .single();

        if (insertError) {
          // Check if it's a duplicate key error (race condition)
          if (insertError.code === '23505') {
            console.log('[AuthContext] User profile already exists (race condition)');
            // Try fetching again
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();
            
            return existingUser;
          } else {
            console.warn('[AuthContext] Failed to create user profile:', insertError);
            return null;
          }
        }

        return newUser;
      }

      return data;
    } catch (err) {
      console.warn('[AuthContext] Exception fetching user profile:', err);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn('[AuthContext] Session error (not clearing state):', sessionError);
        // Don't clear session on network errors - preserve existing state
        return;
      }

      if (session?.user) {
        setCurrentUser(session.user);

        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      } else {
        // Only clear if there's genuinely no session
        setCurrentUser(null);
        setUser(null);
      }
    } catch (error) {
      console.warn('[AuthContext] Failed to refresh user (not clearing state):', error);
      // Don't clear session on network errors - preserve existing state
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;
    let subscription: any;

    async function initialize() {
      try {
        // 1. Get initial session ONCE
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        // 2. Set initial state from session (don't clear on error)
        if (session?.user) {
          setCurrentUser(session.user);
          const userProfile = await fetchUserProfile(session.user);
          if (mounted) {
            setUser(userProfile);
          }
        }

        // 3. Mark as hydrated (initial load complete)
        if (mounted) {
          setIsHydrated(true);
          setLoading(false);
        }

        // 4. Subscribe to auth state changes
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[AuthContext] Auth state changed:', event);

            if (session?.user) {
              setCurrentUser(session.user);
              const userProfile = await fetchUserProfile(session.user);
              setUser(userProfile);
            } else if (event === 'SIGNED_OUT') {
              // Only clear on explicit sign out, not on network errors
              setCurrentUser(null);
              setUser(null);
            }
          }
        );

        subscription = sub;
      } catch (error) {
        console.warn('[AuthContext] Failed to initialize (preserving state):', error);
        // Don't clear session on network errors
        if (mounted) {
          setIsHydrated(true);
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const userId = currentUser?.id || null;
  const role = user?.role || 'free';
  const isPremium = role === 'premium' || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user,
        userId,
        role,
        isPremium,
        loading,
        isHydrated,
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
