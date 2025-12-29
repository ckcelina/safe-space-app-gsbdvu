
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getSupabaseConfig } from '@/lib/supabase';

export default function SupabaseSetupInstructions() {
  const { colors } = useThemeContext();
  const config = getSupabaseConfig();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          ⚙️ Safe Space Needs Configuration
        </Text>
        
        <Text style={[styles.text, { color: colors.text }]}>
          The app cannot start because Supabase environment variables are missing or invalid.
        </Text>

        {config.error && (
          <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: '#ff4444' }]}>
            <Text style={[styles.errorTitle, { color: '#ff4444' }]}>
              ❌ Configuration Error
            </Text>
            <Text style={[styles.errorText, { color: colors.text }]}>
              {config.error}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Current Configuration Status
          </Text>
          <View style={[styles.statusBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              EXPO_PUBLIC_SUPABASE_URL: {config.url ? '✅ Present' : '❌ Missing'}
            </Text>
            {config.url && (
              <Text style={[styles.statusTextSmall, { color: colors.text }]}>
                Value: {config.url}
              </Text>
            )}
            <Text style={[styles.statusText, { color: colors.text }]}>
              EXPO_PUBLIC_SUPABASE_ANON_KEY: {config.hasKey ? '✅ Present' : '❌ Missing'}
            </Text>
            <Text style={[styles.statusText, { color: colors.text }]}>
              Valid Configuration: {config.isValid ? '✅ Yes' : '❌ No'}
            </Text>
            <Text style={[styles.statusText, { color: colors.text }]}>
              Platform: {Platform.OS}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            How to Fix This in Natively
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            1. Click the &quot;Connect to Project&quot; button in Natively
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            2. Select your Supabase project: &quot;Safe Space&quot;
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            3. Verify these CLIENT environment variables are set:
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.code, { color: colors.text }]}>
              EXPO_PUBLIC_SUPABASE_URL
            </Text>
            <Text style={[styles.code, { color: colors.text }]}>
              EXPO_PUBLIC_SUPABASE_ANON_KEY
            </Text>
          </View>
          <Text style={[styles.text, { color: colors.text }]}>
            4. Restart the app preview (stop and start again)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Important Notes
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            • Environment variables MUST start with EXPO_PUBLIC_ to be available in the client
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            • The URL must start with https:// and contain &quot;supabase.co&quot;
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            • Both variables are required for the app to function
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            • These are CLIENT variables (not server secrets)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Expected Supabase Project
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.code, { color: colors.text }]}>
              Project: Safe Space
            </Text>
            <Text style={[styles.code, { color: colors.text }]}>
              Project ID: zjzvkxvahrbuuyzjzxol
            </Text>
            <Text style={[styles.code, { color: colors.text }]}>
              URL: https://zjzvkxvahrbuuyzjzxol.supabase.co
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Troubleshooting
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            If you&apos;ve set the variables but still see this screen:
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            • Make sure you&apos;re using EXPO_PUBLIC_ prefix (not just SUPABASE_)
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            • Verify the variables are in the &quot;Environment Variables&quot; section (not Edge Function secrets)
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            • Completely stop and restart the preview (not just refresh)
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            • Check the console logs for the actual values being read
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusBox: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
  statusTextSmall: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
    marginLeft: 16,
    marginBottom: 8,
  },
  codeBox: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
});
