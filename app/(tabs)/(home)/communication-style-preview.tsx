
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { IconSymbol } from '@/components/IconSymbol';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { getPersonaById, getPreviewContentById } from '@/constants/TherapistPersonas';
import { showSuccessToast } from '@/utils/toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CommunicationStylePreviewScreen() {
  const params = useLocalSearchParams<{
    therapistPersonaId?: string | string[];
    therapistName?: string | string[];
    styleLabel?: string | string[];
    description?: string | string[];
  }>();

  const therapistPersonaId = Array.isArray(params.therapistPersonaId)
    ? params.therapistPersonaId[0]
    : params.therapistPersonaId || '';
  const therapistName = Array.isArray(params.therapistName)
    ? params.therapistName[0]
    : params.therapistName || '';
  const styleLabel = Array.isArray(params.styleLabel)
    ? params.styleLabel[0]
    : params.styleLabel || '';
  const description = Array.isArray(params.description)
    ? params.description[0]
    : params.description || '';

  const { theme } = useThemeContext();
  const { updatePreferences } = useUserPreferences();
  const insets = useSafeAreaInsets();

  const [tryItInput, setTryItInput] = useState('');
  const [tryItMessages, setTryItMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get persona data
  const persona = getPersonaById(therapistPersonaId);
  const previewContent = getPreviewContentById(therapistPersonaId);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings');
    }
  }, []);

  const handleUseThisStyle = useCallback(async () => {
    setIsUpdating(true);

    const result = await updatePreferences({
      therapist_persona_id: therapistPersonaId || null,
    });

    setIsUpdating(false);

    if (result.success) {
      showSuccessToast('Therapist updated');
      // Navigate back to settings
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/settings');
      }
    } else {
      // Error is already shown by updatePreferences
      console.error('[Preview] Failed to update therapist:', result.error);
    }
  }, [therapistPersonaId, updatePreferences]);

  const handleTryIt = useCallback(() => {
    const input = tryItInput.trim();
    if (!input || !previewContent) return;

    // Add user message
    const userMessage = { role: 'user' as const, content: input };
    
    // Generate assistant response using the persona's local preview rules
    const assistantResponse = previewContent.localPreviewReplyRules(input);
    const assistantMessage = { role: 'assistant' as const, content: assistantResponse };

    // Update messages
    setTryItMessages((prev) => [...prev, userMessage, assistantMessage]);
    setTryItInput('');
  }, [tryItInput, previewContent]);

  if (!persona || !previewContent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.textPrimary }]}>
              Therapist not found
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.primary }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.headerBackButton}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow_back"
                  size={24}
                  color={theme.buttonText}
                />
              </TouchableOpacity>

              <Text style={[styles.headerTitle, { color: theme.buttonText }]}>
                Preview Style
              </Text>

              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 60 + insets.bottom + 16 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Therapist Info Card */}
              <View style={[styles.infoCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <View style={styles.infoHeader}>
                  <Image
                    source={persona.image}
                    style={styles.avatar}
                    resizeMode="cover"
                    accessible={true}
                    accessibilityLabel={`${persona.name} avatar`}
                  />
                  <View style={styles.infoHeaderText}>
                    <Text style={[styles.therapistName, { color: theme.textPrimary }]}>
                      {previewContent.title}
                    </Text>
                    <Text style={[styles.styleLabel, { color: theme.primary }]}>
                      {previewContent.subtitle}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.description, { color: theme.textSecondary }]}>
                  {previewContent.description}
                </Text>
              </View>

              {/* Preview Conversation */}
              <View style={[styles.previewCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Example conversation
                </Text>

                <View style={styles.conversationContainer}>
                  {previewContent.sampleChat.map((message, index) => (
                    <View key={index} style={styles.messageWrapper}>
                      <AnimatedChatBubble
                        message={message.text}
                        isUser={message.role === 'user'}
                        timestamp={undefined}
                        animate={false}
                        therapistName={message.role === 'assistant' ? persona.name : undefined}
                        therapistAvatarSource={message.role === 'assistant' ? persona.image : undefined}
                        therapistPersonaId={message.role === 'assistant' ? therapistPersonaId : undefined}
                      />
                    </View>
                  ))}
                </View>

                {/* What this feels like */}
                <View style={styles.quickTipsContainer}>
                  <Text style={[styles.quickTipsTitle, { color: theme.textPrimary }]}>
                    What this feels like:
                  </Text>
                  {previewContent.quickTips.map((tip, index) => (
                    <View key={index} style={styles.quickTipRow}>
                      <Text style={[styles.quickTipBullet, { color: theme.primary }]}>•</Text>
                      <Text style={[styles.quickTipText, { color: theme.textSecondary }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
                  These are illustrative examples. Actual responses will vary based on your conversation.
                </Text>
              </View>

              {/* Try It Section */}
              <View style={[styles.tryItCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Try it yourself
                </Text>

                <Text style={[styles.tryItDescription, { color: theme.textSecondary }]}>
                  Type a message to see how {persona.name} might respond in this style.
                </Text>

                {/* Display try-it messages */}
                {tryItMessages.length > 0 && (
                  <View style={styles.tryItMessagesContainer}>
                    {tryItMessages.map((message, index) => (
                      <View key={index} style={styles.messageWrapper}>
                        <AnimatedChatBubble
                          message={message.content}
                          isUser={message.role === 'user'}
                          timestamp={undefined}
                          animate={message.role === 'assistant'}
                          therapistName={message.role === 'assistant' ? persona.name : undefined}
                          therapistAvatarSource={message.role === 'assistant' ? persona.image : undefined}
                          therapistPersonaId={message.role === 'assistant' ? therapistPersonaId : undefined}
                        />
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.tryItInputContainer}>
                  <TextInput
                    style={[
                      styles.tryItInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.textPrimary,
                        borderColor: theme.textSecondary + '40',
                      },
                    ]}
                    placeholder={previewContent.placeholderUserPrompt}
                    placeholderTextColor={theme.textSecondary}
                    value={tryItInput}
                    onChangeText={setTryItInput}
                    multiline
                    numberOfLines={3}
                    cursorColor={theme.primary}
                    selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
                  />

                  <TouchableOpacity
                    style={[
                      styles.tryItButton,
                      { backgroundColor: theme.primary },
                      !tryItInput.trim() && styles.tryItButtonDisabled,
                    ]}
                    onPress={handleTryIt}
                    disabled={!tryItInput.trim()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tryItButtonText}>Preview response</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View
              style={[
                styles.bottomButtons,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  paddingBottom: insets.bottom || 16,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.useButton, { backgroundColor: theme.primary }]}
                onPress={handleUseThisStyle}
                disabled={isUpdating}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={`Use ${persona.name} as your therapist`}
                accessibilityRole="button"
              >
                <Text style={styles.useButtonText}>
                  {isUpdating ? 'Updating...' : 'Use this style'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.textSecondary }]}
                onPress={handleBack}
                disabled={isUpdating}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Go back without changing"
                accessibilityRole="button"
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.06, 24),
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: '5%',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  infoHeaderText: {
    flex: 1,
  },
  therapistName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  styleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  conversationContainer: {
    gap: 12,
    marginBottom: 20,
  },
  messageWrapper: {
    width: '100%',
  },
  quickTipsContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  quickTipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  quickTipBullet: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
    marginTop: -2,
  },
  quickTipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tryItCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  tryItDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tryItMessagesContainer: {
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  tryItInputContainer: {
    marginBottom: 0,
  },
  tryItInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  tryItButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryItButtonDisabled: {
    opacity: 0.4,
  },
  tryItButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomButtons: {
    paddingHorizontal: '5%',
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  useButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '10%',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
