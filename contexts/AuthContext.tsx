
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache/memoryCache';

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

  const fetchUserProfile = useCallback(async (authUserId: string, retryCount = 0) => {
    const MAX_RETRIES = 3;

    try {
      console.log('[AuthContext] Fetching user profile for:', authUserId);

      // Step 1: Check if user profile already exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      // CRITICAL: Network errors should NOT clear user state
      // Just log and use fallback - user stays logged in
      if (selectError && selectError.code !== 'PGRST116') {
        console.log('[AuthContext] Error checking existing user profile:', selectError.message);

        // If it's a network error, retry
        if (retryCount < MAX_RETRIES && (selectError.message.includes('network') || selectError.message.includes('fetch'))) {
          console.log(`[AuthContext] Network error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchUserProfile(authUserId, retryCount + 1);
        }

        // Non-network error or max retries reached - use fallback but DON'T logout
        console.log('[AuthContext] Using fallback user profile due to error');
        const { data: authUser } = await supabase.auth.getUser();
        setUser({
          id: authUserId,
          email: authUser.user?.email || null,
          username: null,
          role: 'free',
          created_at: new Date().toISOString()
        });
        return;
      }

      // Step 2: If user exists, set it and stop
      if (existingUser) {
        console.log('[AuthContext] User profile found');
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

      // Step 4: Handle errors gracefully
      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate key error - this is non-fatal, just fetch the existing user
          console.log('[AuthContext] Duplicate user profile detected, fetching existing profile');

          const { data: retryUser, error: retrySelectError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle();

          if (retrySelectError) {
            console.log('[AuthContext] Error fetching existing user after duplicate, using fallback');
          }

          setUser(retryUser || {
            id: authUserId,
            email: authUser.user?.email || null,
            username: null,
            role: 'free',
            created_at: new Date().toISOString()
          });
        } else {
          // Other error - log it but use fallback (DON'T logout)
          console.log('[AuthContext] Error creating user profile:', insertError.message);

          // Retry on network errors
          if (retryCount < MAX_RETRIES && (insertError.message.includes('network') || insertError.message.includes('fetch'))) {
            console.log(`[AuthContext] Network error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return fetchUserProfile(authUserId, retryCount + 1);
          }

          setUser({
            id: authUserId,
            email: authUser.user?.email || null,
            username: null,
            role: 'free',
            created_at: new Date().toISOString()
          });
        }
      } else if (newUser) {
        console.log('[AuthContext] User profile created');
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
    } catch (error: any) {
      console.log('[AuthContext] Error in fetchUserProfile:', error?.message || 'Unknown error');

      // CRITICAL: Network errors should NOT logout user
      // Just use fallback profile and let user continue
      const { data: authUser } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

      setUser({
        id: authUserId,
        email: authUser.user?.email || null,
        username: null,
        role: 'free',
        created_at: new Date().toISOString()
      });
    }
  }, []);

  const refreshUser = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.id);
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Initializing...');

    let mounted = true;

    // Initialize auth with improved error handling and no aggressive timeouts
    const initAuth = async () => {
      try {
        // Get existing session from storage
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('[AuthContext] Error getting initial session:', error.message);
          // Don't throw - just log and continue with no session
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;

        console.log('[AuthContext] Initial session:', session?.user?.email || 'No session');

        // CRITICAL: Set session and user BEFORE fetching profile
        // This prevents race condition where UI shows logged out state briefly
        setSession(session);
        setCurrentUser(session?.user ?? null);

        // Fetch user profile if we have a session
        if (session?.user) {
          // Don't await - let it happen in background
          // UI can show with basic auth info while profile loads
          fetchUserProfile(session.user.id).finally(() => {
            if (mounted) {
              setLoading(false);
            }
          });
        } else {
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (error: any) {
        console.log('[AuthContext] Error initializing auth:', error?.message || 'Unknown error');
        // CRITICAL: Don't clear auth state on initialization error
        // Keep any existing session that might be in memory
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] Auth state changed:', _event, session?.user?.email || 'No session');

      if (!mounted) return;

      setSession(session);
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        // Fetch profile in background, don't block auth state update
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing up user:', email);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            email: email.trim().toLowerCase(),
          }
        }
      });

      if (error) {
        console.log('[AuthContext] Signup error:', error.message);
        return { error };
      }

      console.log('[AuthContext] Signup successful');
      
      // The user profile will be created automatically by fetchUserProfile
      // when the auth state changes to SIGNED_IN
      
      return { error: null };
    } catch (error: any) {
      console.log('[AuthContext] Unexpected signup error:', error?.message || 'Unknown error');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.log('[AuthContext] Sign in error:', error.message);
        return { error };
      }

      console.log('[AuthContext] Sign in successful');
      return { error: null };
    } catch (error: any) {
      console.log('[AuthContext] Unexpected sign in error:', error?.message || 'Unknown error');
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
      
      // Clear in-memory cache
      memoryCache.clearAll();
      console.log('[AuthContext] Memory cache cleared');
      
      // Then call Supabase sign out (this may take time)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.log('[AuthContext] Supabase sign out error:', error.message);
        // Don't throw - we've already cleared local state
      } else {
        console.log('[AuthContext] Supabase sign out successful');
      }
    } catch (error: any) {
      console.log('[AuthContext] Sign out error:', error?.message || 'Unknown error');
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
