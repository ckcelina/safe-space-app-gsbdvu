
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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error('[AuthContext] Session error:', sessionError);
        setCurrentUser(null);
        setUser(null);
        return;
      }

      if (session?.user) {
        setCurrentUser(session.user);
        
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      } else {
        setCurrentUser(null);
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh user:', error);
      setCurrentUser(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Fetch current user on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);
      
      if (session?.user) {
        setCurrentUser(session.user);
        
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      } else {
        setCurrentUser(null);
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
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
