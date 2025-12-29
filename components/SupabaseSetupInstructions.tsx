
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabaseConfigStatus } from '@/lib/supabase';

export default function SupabaseSetupInstructions() {
  const { colors } = useThemeContext();

  const missingVars = [
    !supabaseConfigStatus.hasUrl ? "EXPO_PUBLIC_SUPABASE_URL" : null,
    !supabaseConfigStatus.hasAnonKey ? "EXPO_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter(Boolean);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          🔧 Supabase Configuration Required
        </Text>
        
        <Text style={[styles.text, { color: colors.text }]}>
          Safe Space needs Supabase environment variables to connect to your database.
        </Text>

        {missingVars.length > 0 && (
          <View style={[styles.errorBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.errorTitle, { color: '#ef4444' }]}>
              Missing Variables:
            </Text>
            {missingVars.map((varName, index) => (
              <Text key={index} style={[styles.errorVar, { color: '#ef4444' }]}>
                • {varName}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            1. Add Environment Variables
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            In the Natively dashboard, go to Environment Variables and add:
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.code, { color: colors.text }]}>
              EXPO_PUBLIC_SUPABASE_URL
            </Text>
            <Text style={[styles.codeValue, { color: '#9ca3af' }]}>
              Your Supabase project URL
            </Text>
            <Text style={[styles.codeExample, { color: '#60a5fa' }]}>
              Example: https://xxxxx.supabase.co
            </Text>
          </View>
          <View style={[styles.codeBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.code, { color: colors.text }]}>
              EXPO_PUBLIC_SUPABASE_ANON_KEY
            </Text>
            <Text style={[styles.codeValue, { color: '#9ca3af' }]}>
              Your Supabase anonymous key
            </Text>
            <Text style={[styles.codeExample, { color: '#60a5fa' }]}>
              Found in: Project Settings → API
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            2. Restart the Preview
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            After adding the environment variables, restart the Natively preview for changes to take effect.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            ⚠️ Important Notes
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Variables MUST start with EXPO_PUBLIC_ prefix
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Values must not be empty strings
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Changes require app restart to take effect
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Never commit these values to version control
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            3. Database Setup (After Connection)
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Once connected, ensure your Supabase project has these tables:
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.code, { color: colors.text }]}>
              - auth.users (built-in){'\n'}
              - public.users{'\n'}
              - public.persons{'\n'}
              - public.messages{'\n'}
              - public.memories{'\n'}
              - public.topics
            </Text>
          </View>
          <Text style={[styles.text, { color: colors.text }]}>
            All tables should have Row Level Security (RLS) enabled with policies that enforce user_id = auth.uid()
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            4. Edge Functions (After Connection)
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Deploy these Edge Functions to your Supabase project:
          </Text>
          <View style={[styles.codeBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.code, { color: colors.text }]}>
              - generate-ai-response{'\n'}
              - extract-memories
            </Text>
          </View>
        </View>

        <View style={[styles.helpBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.helpTitle, { color: colors.primary }]}>
            Need Help?
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Check the console logs for detailed error messages and debugging information.
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
    paddingBottom: 48,
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
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorVar: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 8,
    marginVertical: 4,
  },
  codeBox: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 13,
    marginBottom: 4,
  },
  codeExample: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 8,
  },
  helpBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
