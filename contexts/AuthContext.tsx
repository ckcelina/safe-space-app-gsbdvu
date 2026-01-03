
/**
 * Authentication Context with Supabase Auth
 *
 * Provides authentication state and methods throughout the app.
 * Features:
 * - Session persistence via ExpoSecureStore (native) / localStorage (web)
 * - Auto-refresh tokens to keep user logged in
 * - Single session restoration on app launch
 * - Guards against silent logouts
 * - Fetches user profile from public.users table
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "@/lib/supabase";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

// Extended user type with profile data
interface UserProfile {
  id: string;
  email: string;
  role: 'free' | 'premium' | 'admin';
  created_at?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  // Convenience getters
  userId: string | null;
  currentUser: SupabaseUser | null;
  role: 'free' | 'premium' | 'admin';
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Prevent multiple session restorations
  const hasRestoredSession = useRef(false);
  const isMounted = useRef(true);
  const authListenerRef = useRef<{ data: { subscription: any } } | null>(null);

  // Restore session ONCE on app launch
  useEffect(() => {
    if (hasRestoredSession.current) return;
    
    hasRestoredSession.current = true;
    restoreSession();

    return () => {
      isMounted.current = false;
      // Clean up auth listener
      if (authListenerRef.current) {
        authListenerRef.current.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // When app comes to foreground, refresh session if user exists
    if (nextAppState === 'active' && user && session) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session && isMounted.current) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error("[AuthContext] Failed to refresh session on app resume:", error);
      }
    }
  };

  const restoreSession = async () => {
    try {
      setLoading(true);
      console.log("[AuthContext] Restoring session...");
      
      // Get current session from Supabase
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[AuthContext] Error getting session:", error);
        if (isMounted.current) {
          setUser(null);
          setSession(null);
          setUserProfile(null);
        }
        return;
      }

      if (currentSession && currentSession.user && isMounted.current) {
        console.log("[AuthContext] Session restored:", currentSession.user.email);
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Fetch user profile
        await fetchUserProfileInternal(currentSession.user.id);
      } else {
        console.log("[AuthContext] No active session found");
        if (isMounted.current) {
          setUser(null);
          setSession(null);
          setUserProfile(null);
        }
      }

      // Set up auth state listener
      if (!authListenerRef.current) {
        authListenerRef.current = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("[AuthContext] Auth state changed:", event);
          
          if (!isMounted.current) return;

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (newSession && newSession.user) {
              setSession(newSession);
              setUser(newSession.user);
              await fetchUserProfileInternal(newSession.user.id);
            }
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
        });
      }
    } catch (error) {
      console.error("[AuthContext] Failed to restore session:", error);
      if (isMounted.current) {
        setUser(null);
        setSession(null);
        setUserProfile(null);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  };

  const fetchUserProfileInternal = async (userId: string) => {
    try {
      console.log("[AuthContext] Fetching user profile for:", userId);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("[AuthContext] Error fetching user profile:", error);
        return;
      }

      if (!profile && isMounted.current) {
        // Profile doesn't exist, create it
        console.log("[AuthContext] User profile not found, creating one...");
        
        const { data: authUser } = await supabase.auth.getUser();
        
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email: authUser.user?.email || '',
            role: 'free',
          }]);

        if (insertError) {
          if (insertError.code === '23505') {
            console.log("[AuthContext] User profile already exists (race condition)");
            // Try fetching again
            const { data: retryProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .maybeSingle();
            
            if (retryProfile && isMounted.current) {
              setUserProfile(retryProfile);
            }
          } else {
            console.error("[AuthContext] Failed to create user profile:", insertError);
          }
        } else {
          console.log("[AuthContext] User profile created successfully");
          // Fetch the newly created profile
          const { data: newProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          
          if (newProfile && isMounted.current) {
            setUserProfile(newProfile);
          }
        }
      } else if (profile && isMounted.current) {
        console.log("[AuthContext] User profile loaded");
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("[AuthContext] Exception fetching user profile:", error);
    }
  };

  const fetchUserProfile = async () => {
    if (user) {
      await fetchUserProfileInternal(user.id);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.user && isMounted.current) {
        setSession(data.session);
        setUser(data.user);
        await fetchUserProfileInternal(data.user.id);
      }
    } catch (error) {
      console.error("[AuthContext] Email sign in failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.user && isMounted.current) {
        setSession(data.session);
        setUser(data.user);
        
        // Create user profile
        await fetchUserProfileInternal(data.user.id);
      }
    } catch (error) {
      console.error("[AuthContext] Email sign up failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Guard: Only sign out if user exists
      if (!user) {
        console.warn("[AuthContext] signOut called but no user is logged in");
        return;
      }

      console.log("[AuthContext] Signing out...");
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      if (isMounted.current) {
        setUser(null);
        setSession(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("[AuthContext] Sign out failed:", error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      if (data.session && data.session.user && isMounted.current) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to refresh session:", error);
      throw error;
    }
  };

  // Convenience getters
  const userId = user?.id || null;
  const currentUser = user;
  const role = userProfile?.role || 'free';
  const isPremium = role === 'premium' || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        initialized,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshSession,
        fetchUserProfile,
        userId,
        currentUser,
        role,
        isPremium,
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
