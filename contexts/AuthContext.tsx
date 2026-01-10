
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { router } from 'expo-router';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    console.log('[Auth] Initializing auth state...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session:', session ? 'Found' : 'None');
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[Auth] Auth state changed:', _event, session ? 'Session exists' : 'No session');
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('[Auth] Loading user profile for:', supabaseUser.id);
      
      // Fetch user profile from public.users
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Error loading user profile:', error);
      }

      // If no profile exists, create one
      if (!userData) {
        console.log('[Auth] No profile found, creating one...');
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: supabaseUser.id,
            role: 'free',
          });

        if (insertError) {
          console.error('[Auth] Error creating profile:', insertError);
        }

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: 'free',
        });
      } else {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: userData.role || 'free',
        });
      }
    } catch (error) {
      console.error('[Auth] Unexpected error loading profile:', error);
      // Set basic user info even if profile fetch fails
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: 'free',
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        throw error;
      }

      console.log('[Auth] Sign in successful');
      // Auth state change listener will handle the rest
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('[Auth] Signing up...');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('[Auth] Sign up error:', error);
        throw error;
      }

      console.log('[Auth] Sign up successful');
      // Auth state change listener will handle the rest
    } catch (error) {
      console.error('[Auth] Sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Auth] Sign out error:', error);
        throw error;
      }

      console.log('[Auth] Sign out successful');
      setUser(null);
      setSession(null);
      router.replace('/login');
    } catch (error) {
      console.error('[Auth] Sign out failed:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      console.log('[Auth] Refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Auth] Session refresh error:', error);
        throw error;
      }

      console.log('[Auth] Session refreshed');
      setSession(session);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('[Auth] Session refresh failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
