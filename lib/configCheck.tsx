
/**
 * Configuration Check Component
 * 
 * Displays a friendly error UI when Supabase is not configured.
 * Only shows in development mode to help developers set up the app.
 * Backend URL is optional for Supabase-only apps.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { isSupabaseConfigured, getSupabaseConfigError } from './supabase';

export function ConfigurationCheck({ children }: { children: React.ReactNode }) {
  const supabaseConfigured = isSupabaseConfigured();
  
  // In production, always render children even if not configured
  if (!__DEV__) {
    return <>{children}</>;
  }
  
  // In development, only show error if Supabase is not configured
  // Backend URL is optional for Supabase-only apps
  if (!supabaseConfigured) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>⚙️ Configuration Required</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❌ Supabase Not Configured</Text>
            <Text style={styles.text}>
              Please add your Supabase credentials to continue:
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.code}>
                EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co{'\n'}
                EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Setup Instructions</Text>
            <Text style={styles.text}>
              1. Create a .env file in your project root{'\n'}
              2. Add the environment variables above{'\n'}
              3. Restart the Expo dev server{'\n'}
              4. Reload the app
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Optional: Backend URL</Text>
            <Text style={styles.text}>
              If you need a custom backend, add:{'\n'}
              EXPO_PUBLIC_BACKEND_URL=https://your-backend.com
            </Text>
          </View>
          
          <Text style={styles.footer}>
            This message only appears in development mode.
          </Text>
        </ScrollView>
      </View>
    );
  }
  
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#00ff00',
    lineHeight: 18,
  },
  footer: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});
