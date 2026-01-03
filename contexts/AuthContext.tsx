
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { router } from 'expo-router';

interface PublicUser {
  id: string;
  user_id: string;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  publicUser: PublicUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updatePublicUser: (updates: Partial<PublicUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setUser(null);
        setPublicUser(null);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        
        // Fetch public user data
        const { data: publicUserData, error: publicUserError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (publicUserError) {
          console.error('Public user fetch error:', publicUserError);
          
          // If user doesn't exist in public.users, create it
          if (publicUserError.code === 'PGRST116') {
            const { data: newPublicUser, error: insertError } = await supabase
              .from('users')
              .insert({
                user_id: session.user.id,
                role: 'free',
              })
              .select()
              .single();

            if (insertError) {
              console.error('Failed to create public user:', insertError);
            } else {
              setPublicUser(newPublicUser);
            }
          }
        } else {
          setPublicUser(publicUserData);
        }
      } else {
        setUser(null);
        setPublicUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      setPublicUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current user on mount
  useEffect(() => {
    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        // Fetch or create public user
        const { data: publicUserData, error: publicUserError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (publicUserError && publicUserError.code === 'PGRST116') {
          // Create public user if doesn't exist
          const { data: newPublicUser, error: insertError } = await supabase
            .from('users')
            .insert({
              user_id: session.user.id,
              role: 'free',
            })
            .select()
            .single();

          if (!insertError) {
            setPublicUser(newPublicUser);
          }
        } else if (!publicUserError) {
          setPublicUser(publicUserData);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPublicUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Create public user record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: data.user.id,
            role: 'free',
          });

        if (insertError) {
          console.error('Failed to create public user (non-blocking):', insertError);
          // Don't throw - allow signup to succeed even if public user creation fails
        }

        await fetchUser();
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Check if public user exists, create if not
        const { data: publicUserData, error: publicUserError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (publicUserError && publicUserError.code === 'PGRST116') {
          // Create public user if doesn't exist
          await supabase
            .from('users')
            .insert({
              user_id: data.user.id,
              role: 'free',
            });
        }

        await fetchUser();
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      setPublicUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const updatePublicUser = async (updates: Partial<PublicUser>) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPublicUser(data);
    } catch (error) {
      console.error('Failed to update public user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        publicUser,
        loading,
        signUp,
        signIn,
        signOut,
        fetchUser,
        updatePublicUser,
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
