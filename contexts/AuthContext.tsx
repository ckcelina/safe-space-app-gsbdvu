
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const fetchUserProfile = async (authUserId: string, retryCount = 0) => {
    const MAX_RETRIES = 2;
    
    try {
      console.log('[AuthContext] Fetching user profile for:', authUserId);
      
      // Step 1: Check if user profile already exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.log('[AuthContext] Error checking existing user profile:', selectError.message);
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

      // Step 4: Handle duplicate key error gracefully
      if (insertError) {
        if (insertError.code === '23505') {
          // Duplicate key error - this is non-fatal
          console.log('[AuthContext] Duplicate user profile detected, fetching existing profile');
          
          // Re-select the existing user profile
          const { data: retryUser, error: retrySelectError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle();

          if (retrySelectError) {
            console.log('[AuthContext] Error fetching existing user profile after duplicate error:', retrySelectError.message);
            // Set a fallback user object
            setUser({ 
              id: authUserId, 
              email: authUser.user?.email || null,
              username: null,
              role: 'free', 
              created_at: new Date().toISOString() 
            });
          } else if (retryUser) {
            console.log('[AuthContext] Successfully fetched existing user profile');
            setUser(retryUser);
          } else {
            console.log('[AuthContext] No user found after duplicate error, using fallback');
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
          console.log('[AuthContext] Error creating user profile:', insertError.message);
          
          // Retry logic for transient errors
          if (retryCount < MAX_RETRIES && insertError.message.includes('network')) {
            console.log(`[AuthContext] Retrying profile creation (${retryCount + 1}/${MAX_RETRIES})...`);
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
    console.log('[AuthContext] Initializing auth...');
    let mounted = true;
    
    // Initialize session on mount
    const initAuth = async () => {
      try {
        // Get session from storage (AsyncStorage via Supabase client)
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('[AuthContext] Error getting initial session:', error.message);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('[AuthContext] Initial session:', currentSession?.user?.email || 'No session');
        
        if (mounted) {
          setSession(currentSession);
          setCurrentUser(currentSession?.user ?? null);
          
          // OPTIMIZATION: Set loading to false immediately after session check
          // Fetch user profile in background without blocking UI
          setLoading(false);
          
          if (currentSession?.user) {
            // Fetch profile asynchronously without blocking
            fetchUserProfile(currentSession.user.id).catch((err) => {
              console.log('[AuthContext] Background profile fetch failed:', err);
            });
          }
        }
      } catch (error: any) {
        console.log('[AuthContext] Error initializing auth:', error?.message || 'Unknown error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AuthContext] Auth state changed:', event, newSession?.user?.email || 'No session');
      
      if (!mounted) return;

      setSession(newSession);
      setCurrentUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        // Fetch profile in background
        fetchUserProfile(newSession.user.id).catch((err) => {
          console.log('[AuthContext] Background profile fetch failed:', err);
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      
      // Then call Supabase sign out (this clears AsyncStorage session)
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
