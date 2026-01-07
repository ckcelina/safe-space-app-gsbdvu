
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  user_metadata?: any;
}

interface AuthContextType {
  user: User | null;
  authUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  userId: string | null;
  email: string | null;
  role: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile();
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // Fetch user profile from public.users
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }

      // If profile doesn't exist, create it
      if (!profile) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: authUser.id,
            role: 'free',
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }

        setRole('free');
      } else {
        setRole(profile.role || 'free');
      }

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        user_metadata: authUser.user_metadata,
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      await fetchUserProfile();
    } catch (error) {
      console.error('Email sign in failed:', error);
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

      // Create user profile
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: data.user.id,
            role: 'free',
          });

        // Don't block signup if profile creation fails
        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }
      }

      await fetchUserProfile();
    } catch (error) {
      console.error('Email sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthUser(null);
      setSession(null);
      setRole(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        session,
        loading,
        userId: authUser?.id || null,
        email: authUser?.email || null,
        role,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context (strict)
 * Must be used within AuthProvider - throws error otherwise
 * Use this for screens that require authentication
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Hook to access auth context (optional)
 * Returns safe defaults if used outside AuthProvider
 * Use this for screens where auth is optional or can handle loading state
 */
export function useAuthOptional(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return safe defaults instead of throwing
    console.warn('useAuthOptional: Used outside AuthProvider, returning safe defaults');
    return {
      user: null,
      authUser: null,
      session: null,
      loading: true,
      userId: null,
      email: null,
      role: null,
      signInWithEmail: async () => {
        console.warn('useAuthOptional: signInWithEmail called outside AuthProvider');
      },
      signUpWithEmail: async () => {
        console.warn('useAuthOptional: signUpWithEmail called outside AuthProvider');
      },
      signOut: async () => {
        console.warn('useAuthOptional: signOut called outside AuthProvider');
      },
      fetchUserProfile: async () => {
        console.warn('useAuthOptional: fetchUserProfile called outside AuthProvider');
      },
    };
  }
  return context;
}
