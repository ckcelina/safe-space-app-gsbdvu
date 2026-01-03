
/**
 * Authentication Context
 * 
 * Manages user authentication state using Supabase Auth with proper session persistence.
 * 
 * Key features:
 * - Automatic session restoration on app reload via AsyncStorage
 * - Prevents race conditions by waiting for initial session check
 * - Uses onAuthStateChange for automatic session updates
 * - Handles Fast Refresh without losing auth state
 */

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  authUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Track if we've already set up the listener to prevent duplicates on Fast Refresh
  const listenerSetup = useRef(false);

  /**
   * Fetch user profile from public.users table
   * Memoized to prevent unnecessary re-renders
   */
  const fetchUserProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return {
        id: userId,
        email: email,
        name: profile?.name,
        role: profile?.role || 'free',
      };
    } catch (error) {
      console.error('[Auth] Error fetching user profile:', error);
      // Return basic user info even if profile fetch fails
      return {
        id: userId,
        email: email,
        role: 'free',
      };
    }
  }, []);

  /**
   * Update auth state from session
   */
  const updateAuthState = useCallback(async (currentSession: Session | null) => {
    if (currentSession?.user) {
      console.log('[Auth] Session found, updating auth state');
      setSession(currentSession);
      setAuthUser(currentSession.user);
      
      const userProfile = await fetchUserProfile(
        currentSession.user.id,
        currentSession.user.email || ''
      );
      setUser(userProfile);
    } else {
      console.log('[Auth] No session, clearing auth state');
      setSession(null);
      setAuthUser(null);
      setUser(null);
    }
  }, [fetchUserProfile]);

  /**
   * Fetch current user session
   * Safe to call multiple times - won't cause race conditions
   */
  const fetchUser = useCallback(async () => {
    try {
      console.log('[Auth] Fetching current session...');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Error fetching session:', error);
        return;
      }
      
      await updateAuthState(currentSession);
    } catch (error) {
      console.error('[Auth] Error in fetchUser:', error);
    }
  }, [updateAuthState]);

  /**
   * Sign out user
   */
  const signOut = useCallback(async () => {
    try {
      console.log('[Auth] Signing out...');
      await supabase.auth.signOut();
      setUser(null);
      setAuthUser(null);
      setSession(null);
    } catch (error) {
      console.error('[Auth] Error signing out:', error);
    }
  }, []);

  /**
   * Initialize auth state on mount
   * This runs ONCE when the app starts
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing auth state...');
        
        // Get initial session from AsyncStorage (persisted from previous app session)
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting initial session:', error);
        }
        
        if (mounted) {
          await updateAuthState(initialSession);
          setInitialized(true);
          setLoading(false);
          console.log('[Auth] Initialization complete. Session:', initialSession ? 'Found' : 'None');
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [updateAuthState]);

  /**
   * Set up auth state change listener
   * This listens for login/logout/token refresh events
   */
  useEffect(() => {
    // Prevent duplicate listeners on Fast Refresh
    if (listenerSetup.current) {
      console.log('[Auth] Listener already set up, skipping');
      return;
    }

    console.log('[Auth] Setting up auth state change listener');
    listenerSetup.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[Auth] Auth state changed:', event);
      
      // Update state based on the new session
      await updateAuthState(currentSession);
      
      // Mark as initialized after first auth state change
      if (!initialized) {
        setInitialized(true);
        setLoading(false);
      }
    });

    return () => {
      console.log('[Auth] Cleaning up auth state listener');
      subscription.unsubscribe();
      listenerSetup.current = false;
    };
  }, [updateAuthState, initialized]);

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        session,
        loading,
        initialized,
        fetchUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
