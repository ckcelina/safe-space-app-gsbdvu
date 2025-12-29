
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function SupabaseSetupInstructions() {
  const { colors } = useThemeContext();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Supabase Setup Required
        </Text>
        
        <Text style={[styles.text, { color: colors.text }]}>
          To use Safe Space, you need to connect to your Supabase project:
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            1. Enable Supabase
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Press the Supabase button in Natively and connect to your existing Supabase project.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            2. Database Tables
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Make sure your Supabase project has these tables:
          </Text>
          <Text style={[styles.code, { color: colors.text, backgroundColor: colors.card }]}>
            - auth.users (built-in){'\n'}
            - public.users (id, user_id, role, created_at){'\n'}
            - public.persons (id, user_id, name, relationship_type, created_at){'\n'}
            - public.messages (id, user_id, person_id, sender, content, created_at)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            3. Row Level Security (RLS)
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Enable RLS on all tables with policies that enforce user_id = auth.uid()
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            4. Edge Function
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Deploy an Edge Function named &quot;generate-ai-response&quot; that accepts:
          </Text>
          <Text style={[styles.code, { color: colors.text, backgroundColor: colors.card }]}>
            {`{
  person_id: string,
  messages: Array<{role: string, content: string}>
}`}
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            And returns:
          </Text>
          <Text style={[styles.code, { color: colors.text, backgroundColor: colors.card }]}>
            {`{ reply: string }`}
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
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
});
