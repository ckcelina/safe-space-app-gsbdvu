
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Alert, Platform } from 'react-native';

// Environment variables with validation
const supabaseUrl = 'https://zjzvkxvahrbuuyzjzxol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZreHZhaHJidXV5emp6eG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQ0MjMsImV4cCI6MjA4MDQxMDQyM30.TrjFcA0HEbA6ocLLlbadS0RwuEjKU0ttnacGXyEk1M8';

// Validate environment variables at startup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables!');
  console.error('[Supabase] URL:', supabaseUrl ? 'Present' : 'MISSING');
  console.error('[Supabase] Key:', supabaseAnonKey ? 'Present' : 'MISSING');
}

// Lazy initialization - client is created on first access
let supabaseInstance: SupabaseClient | null = null;

// Create a getter that initializes the client only when accessed
function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('[Supabase] Initializing client...');
    
    // Only initialize if we're in a runtime environment (not during build)
    if (typeof window === 'undefined' && Platform.OS === 'web') {
      throw new Error('[Supabase] Cannot initialize during SSR/build phase');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Add custom storage key for easier debugging
        storageKey: 'sb-zjzvkxvahrbuuyzjzxol-auth-token',
        // Disable automatic session recovery on errors
        flowType: 'pkce',
      },
    });
    
    console.log('[Supabase] Client initialized successfully');
  }
  
  return supabaseInstance;
}

// Export a proxy object that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  }
});

// Export a function to check if client is ready
export const isSupabaseReady = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Helper function to safely check if a session exists
export const hasActiveSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Supabase] Error checking session:', error);
      return false;
    }
    
    return !!session;
  } catch (error) {
    console.error('[Supabase] Error in hasActiveSession:', error);
    return false;
  }
};
