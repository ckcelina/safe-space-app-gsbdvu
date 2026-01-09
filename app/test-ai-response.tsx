
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';

export default function TestAIResponseScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { theme } = useThemeContext();

  const [testMessage, setTestMessage] = useState('Hello, how are you?');
  const [personName, setPersonName] = useState('Test Person');
  const [relationshipType, setRelationshipType] = useState('Friend');
  const [subject, setSubject] = useState('General');
  const [therapistPersonaId, setTherapistPersonaId] = useState('dr_elias');
  
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to test');
      return;
    }

    if (!testMessage.trim()) {
      setError('Please enter a test message');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('[Test] Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('No valid session. Please log in again.');
      }

      const accessToken = session.access_token;
      console.log('[Test] Session validated - token length:', accessToken.length);

      // Create a test payload
      const testPayload = {
        userId: currentUser.id,
        personId: 'test-person-id',
        personName: personName,
        personRelationshipType: relationshipType,
        messages: [
          {
            role: 'user',
            content: testMessage,
            createdAt: new Date().toISOString(),
          },
        ],
        currentSubject: subject,
        therapistPersonaId: therapistPersonaId,
      };

      console.log('[Test] Calling Edge Function with payload:', testPayload);

      const { data, error: invokeError } = await supabase.functions.invoke('generate-ai-response', {
        body: testPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('[Test] Response received:', { data, error: invokeError });

      if (invokeError) {
        throw new Error(invokeError.message || 'Edge Function invocation failed');
      }

      if (data?.ok === false || data?.error) {
        throw new Error(data.error?.message || 'Edge Function returned an error');
      }

      setResponse(data);
      console.log('[Test] ✅ Success!');
    } catch (err: any) {
      console.error('[Test] ❌ Error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(home)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.statusBarGradient, { height: insets.top }]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={theme.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test AI Response</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Test Configuration</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Test Message</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder="Enter a test message..."
            placeholderTextColor={theme.textSecondary}
            value={testMessage}
            onChangeText={setTestMessage}
            multiline
            numberOfLines={3}
            editable={!isLoading}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Person Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder="Person name..."
            placeholderTextColor={theme.textSecondary}
            value={personName}
            onChangeText={setPersonName}
            editable={!isLoading}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Relationship Type</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder="Relationship type..."
            placeholderTextColor={theme.textSecondary}
            value={relationshipType}
            onChangeText={setRelationshipType}
            editable={!isLoading}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Subject</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder="Subject..."
            placeholderTextColor={theme.textSecondary}
            value={subject}
            onChangeText={setSubject}
            editable={!isLoading}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Therapist Persona ID</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder="Therapist persona ID..."
            placeholderTextColor={theme.textSecondary}
            value={therapistPersonaId}
            onChangeText={setTherapistPersonaId}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primary }]}
            onPress={handleTest}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <React.Fragment>
                <IconSymbol
                  ios_icon_name="play.fill"
                  android_material_icon_name="play_arrow"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.testButtonText}>Test Edge Function</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.section, { backgroundColor: '#FF3B30' }]}>
            <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Error</Text>
            <Text style={[styles.errorText, { color: '#FFFFFF' }]}>{error}</Text>
          </View>
        )}

        {response && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Response</Text>

            {response.ok && response.data && (
              <React.Fragment>
                <View style={styles.responseItem}>
                  <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Status:</Text>
                  <Text style={[styles.responseValue, { color: '#34C759' }]}>✅ Success</Text>
                </View>

                <View style={styles.responseItem}>
                  <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Reply Text:</Text>
                  <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                    {response.data.replyText || 'No reply text'}
                  </Text>
                </View>

                {response.data.assistantMessage && (
                  <React.Fragment>
                    <View style={styles.responseItem}>
                      <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Message ID:</Text>
                      <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                        {response.data.assistantMessage.id}
                      </Text>
                    </View>

                    <View style={styles.responseItem}>
                      <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Content:</Text>
                      <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                        {response.data.assistantMessage.content}
                      </Text>
                    </View>

                    <View style={styles.responseItem}>
                      <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Subject:</Text>
                      <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                        {response.data.assistantMessage.subject || 'None'}
                      </Text>
                    </View>
                  </React.Fragment>
                )}

                {response.latency && (
                  <React.Fragment>
                    <View style={styles.responseItem}>
                      <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Total Latency:</Text>
                      <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                        {response.latency.total}ms
                      </Text>
                    </View>

                    <View style={styles.responseItem}>
                      <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>OpenAI Latency:</Text>
                      <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                        {response.latency.openai}ms
                      </Text>
                    </View>

                    <View style={styles.responseItem}>
                      <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>DB Insert Latency:</Text>
                      <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                        {response.latency.dbInsert}ms
                      </Text>
                    </View>
                  </React.Fragment>
                )}

                <View style={styles.responseItem}>
                  <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Request ID:</Text>
                  <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                    {response.requestId}
                  </Text>
                </View>
              </React.Fragment>
            )}

            {response.ok === false && (
              <React.Fragment>
                <View style={styles.responseItem}>
                  <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Status:</Text>
                  <Text style={[styles.responseValue, { color: '#FF3B30' }]}>❌ Failed</Text>
                </View>

                <View style={styles.responseItem}>
                  <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Error Code:</Text>
                  <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                    {response.error?.code || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.responseItem}>
                  <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Error Message:</Text>
                  <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                    {response.error?.message || 'Unknown error'}
                  </Text>
                </View>

                {response.error?.details && (
                  <View style={styles.responseItem}>
                    <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Error Details:</Text>
                    <Text style={[styles.responseValue, { color: theme.textPrimary }]}>
                      {JSON.stringify(response.error.details, null, 2)}
                    </Text>
                  </View>
                )}
              </React.Fragment>
            )}

            <View style={styles.responseItem}>
              <Text style={[styles.responseLabel, { color: theme.textSecondary }]}>Full Response:</Text>
              <ScrollView
                horizontal
                style={[styles.jsonContainer, { backgroundColor: theme.background }]}
              >
                <Text style={[styles.jsonText, { color: theme.textPrimary }]}>
                  {JSON.stringify(response, null, 2)}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Instructions</Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            This screen allows you to test the generate-ai-response Edge Function directly.
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            1. Enter a test message
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            2. Configure the test parameters (optional)
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            3. Tap &quot;Test Edge Function&quot;
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
            4. View the response below
          </Text>
          <Text style={[styles.instructionText, { color: theme.textSecondary, marginTop: 12 }]}>
            Note: This will NOT create a real person or save messages to your account. It uses a test person ID.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  responseItem: {
    marginBottom: 16,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  responseValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  jsonContainer: {
    maxHeight: 300,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  jsonText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
