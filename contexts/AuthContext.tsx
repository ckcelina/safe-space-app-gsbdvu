
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  currentUser: SupabaseUser | null;
  user: UserProfile | null;
  userId: string | null;
  email: string | null;
  role: 'free' | 'premium' | 'admin';
  isPremium: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUserId: string) => {
    try {
      console.log('[AuthContext] Fetching user profile for:', authUserId);
      
      // Step 1: Check if user profile already exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('[AuthContext] Error checking existing user profile:', selectError);
      }

      // Step 2: If user exists, set it and stop
      if (existingUser) {
        console.log('[AuthContext] User profile found:', existingUser);
        setUser(existingUser);
        return;
      }

      // Step 3: User doesn't exist, create one
      console.log('[AuthContext] User profile not found, creating one');
      const { data: authUser } = await supabase.auth.getUser();
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ 
          id: authUserId, 
          email: authUser.user?.email || null,
          role: 'free' 
        }])
        .select()
        .maybeSingle();

      // Step 4: Handle duplicate key error gracefully
      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate key error - this is non-fatal
          console.warn('[AuthContext] Duplicate user profile detected, fetching existing profile.');
          
          // Re-select the existing user profile
          const { data: retryUser, error: retrySelectError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle();

          if (retrySelectError) {
            console.error('[AuthContext] Error fetching existing user profile after duplicate error:', retrySelectError);
            // Set a fallback user object
            setUser({ 
              id: authUserId, 
              email: authUser.user?.email || null,
              username: null,
              role: 'free', 
              created_at: new Date().toISOString() 
            });
          } else if (retryUser) {
            console.log('[AuthContext] Successfully fetched existing user profile:', retryUser);
            setUser(retryUser);
          } else {
            console.warn('[AuthContext] No user found after duplicate error, using fallback');
            setUser({ 
              id: authUserId, 
              email: authUser.user?.email || null,
              username: null,
              role: 'free', 
              created_at: new Date().toISOString() 
            });
          }
        } else {
          // Real error - log it but don't block the user
          console.error('[AuthContext] Error creating user profile:', insertError);
          setUser({ 
            id: authUserId, 
            email: authUser.user?.email || null,
            username: null,
            role: 'free', 
            created_at: new Date().toISOString() 
          });
        }
      } else if (newUser) {
        console.log('[AuthContext] User profile created:', newUser);
        setUser(newUser);
      } else {
        // Fallback if insert returns no data
        setUser({ 
          id: authUserId, 
          email: authUser.user?.email || null,
          username: null,
          role: 'free', 
          created_at: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('[AuthContext] Error in fetchUserProfile:', error);
      // Set a default user object to prevent blocking
      setUser({ 
        id: authUserId, 
        email: null,
        username: null,
        role: 'free', 
        created_at: new Date().toISOString() 
      });
    }
  };

  const refreshUser = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.id);
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Initializing...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthContext] Error getting initial session:', error);
        setLoading(false);
        return;
      }

      console.log('[AuthContext] Initial session:', session?.user?.email || 'No session');
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('[AuthContext] Error getting initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthContext] Auth state changed:', _event, session?.user?.email || 'No session');
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing up user:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed'
        }
      });

      if (error) {
        console.error('[AuthContext] Signup error:', error);
        return { error };
      }

      console.log('[AuthContext] Signup successful:', data.user?.email || 'No email');
      
      // The user profile will be created automatically by fetchUserProfile
      // when the auth state changes to SIGNED_IN
      
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Unexpected signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        return { error };
      }

      console.log('[AuthContext] Sign in successful:', data.user?.email || 'No email');
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Unexpected sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Starting sign out...');
      
      // Clear local state FIRST to ensure UI updates immediately
      setSession(null);
      setCurrentUser(null);
      setUser(null);
      
      console.log('[AuthContext] Local state cleared');
      
      // Then call Supabase sign out (this may take time)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Supabase sign out error:', error);
        // Don't throw - we've already cleared local state
      } else {
        console.log('[AuthContext] Supabase sign out successful');
      }
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      // Even if there's an error, state is already cleared
    }
  };

  // Compute isPremium based on role
  const userRole = user?.role ?? 'free';
  const isPremium = userRole === 'premium' || userRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        currentUser,
        user,
        userId: currentUser?.id ?? null,
        email: currentUser?.email ?? null,
        role: userRole,
        isPremium,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
