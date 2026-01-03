
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface PublicUser {
  id: string;
  user_id: string;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}

interface AuthContextType {
  authUser: SupabaseUser | null;
  publicUser: PublicUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const listenerSetup = useRef(false);

  const fetchPublicUser = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching public user:', error);
        return null;
      }

      if (!data) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({ user_id: userId, role: 'free' })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating public user:', insertError);
          return null;
        }

        return newUser;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error fetching public user:', err);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        setAuthUser(currentSession.user);
        setSession(currentSession);
        const pubUser = await fetchPublicUser(currentSession.user.id);
        setPublicUser(pubUser);
      } else {
        setAuthUser(null);
        setSession(null);
        setPublicUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [fetchPublicUser]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession?.user) {
            setAuthUser(initialSession.user);
            setSession(initialSession);
            const pubUser = await fetchPublicUser(initialSession.user.id);
            setPublicUser(pubUser);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    if (!listenerSetup.current) {
      listenerSetup.current = true;
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;

        if (newSession?.user) {
          setAuthUser(newSession.user);
          setSession(newSession);
          const pubUser = await fetchPublicUser(newSession.user.id);
          setPublicUser(pubUser);
        } else {
          setAuthUser(null);
          setSession(null);
          setPublicUser(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [fetchPublicUser]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) throw error;
    
    if (data.user) {
      await fetchPublicUser(data.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) throw error;
    
    if (data.user) {
      await fetchPublicUser(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setAuthUser(null);
    setSession(null);
    setPublicUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        publicUser,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUser,
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
