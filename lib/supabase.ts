
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjzvkxvahrbuuyzjzxol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenZreHZhaHJidXV5emp6eG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQ0MjMsImV4cCI6MjA4MDQxMDQyM30.TrjFcA0HEbA6ocLLlbadS0RwuEjKU0ttnacGXyEk1M8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
