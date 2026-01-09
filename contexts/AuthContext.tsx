
/**
 * Authentication Context for Safe Space
 *
 * Provides authentication state and methods throughout the app.
 * Integrates with Supabase for user management.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

// User type from Supabase
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  userId: string | null;
  currentUser: User | null;
  email: string | null;
  role: string | null;
  isPremium: boolean;
  loading: boolean;
  session: any;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount - async and non-blocking
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth] Failed to fetch session:", error);
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        } else if (currentSession?.user) {
          if (mounted) {
            setSession(currentSession);
            
            // Fetch user profile from public.users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('user_id', currentSession.user.id)
              .maybeSingle();
            
            if (userError) {
              console.error("[Auth] Failed to fetch user profile:", userError);
            }
            
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              name: userData?.name || currentSession.user.user_metadata?.name,
              role: userData?.role || 'free',
            });
          }
        } else {
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("[Auth] Failed to initialize auth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[Auth] Auth state changed:", event);
      
      if (mounted) {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Fetch user profile
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();
          
          if (userError) {
            console.error("[Auth] Failed to fetch user profile:", userError);
          }
          
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: userData?.name || currentSession.user.user_metadata?.name,
            role: userData?.role || 'free',
          });
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[Auth] Failed to fetch session:", error);
        setSession(null);
        setUser(null);
      } else if (currentSession?.user) {
        setSession(currentSession);
        
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();
        
        if (userError) {
          console.error("[Auth] Failed to fetch user profile:", userError);
        }
        
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          name: userData?.name || currentSession.user.user_metadata?.name,
          role: userData?.role || 'free',
        });
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error("[Auth] Failed to fetch user:", error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Auth] Email sign in failed:", error);
        throw error;
      }

      await fetchUser();
    } catch (error) {
      console.error("[Auth] Email sign in failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        console.error("[Auth] Email sign up failed:", error);
        throw error;
      }

      // Create user profile in public.users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              user_id: data.user.id,
              role: 'free',
            },
          ]);

        if (profileError) {
          console.error("[Auth] Failed to create user profile:", profileError);
          // Don't throw - allow signup to succeed even if profile creation fails
        }
      }

      await fetchUser();
    } catch (error) {
      console.error("[Auth] Email sign up failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("[Auth] Sign out failed:", error);
      // Don't throw - allow user to continue even if sign out fails
    }
  };

  const userId = user?.id || null;
  const currentUser = user;
  const email = user?.email || null;
  const role = user?.role || null;
  const isPremium = role === 'premium' || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        currentUser,
        email,
        role,
        isPremium,
        loading,
        session,
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
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
