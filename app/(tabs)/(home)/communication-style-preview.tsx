
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();

  const [tryItInput, setTryItInput] = useState('');
  const [tryItMessages, setTryItMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get persona data
  const persona = getPersonaById(therapistPersonaId);
  const previewContent = getPreviewContentById(therapistPersonaId);

  // Responsive scaling
  const isSmallDevice = height < 700;
  const isLargeDevice = height > 850;
  
  const scale = {
    headerHeight: isSmallDevice ? 50 : 60,
    titleSize: Math.min(Math.max(width * 0.045, 18), 22),
    avatarSize: isSmallDevice ? 70 : isLargeDevice ? 90 : 80,
    nameSize: isSmallDevice ? 20 : isLargeDevice ? 26 : 24,
    subtitleSize: isSmallDevice ? 14 : 16,
    descriptionSize: isSmallDevice ? 14 : 15,
    cardPadding: isSmallDevice ? 16 : isLargeDevice ? 24 : 20,
    sectionTitleSize: isSmallDevice ? 16 : 18,
    buttonHeight: isSmallDevice ? 50 : 56,
  };

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

  const BOTTOM_ACTION_HEIGHT = scale.buttonHeight * 2 + 12 + 32; // Two buttons + gap + padding

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
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.container}>
            {/* Compact Header */}
            <View style={[styles.header, { height: scale.headerHeight }]}>
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
                  size={22}
                  color={theme.buttonText}
                />
              </TouchableOpacity>

              <Text style={[styles.headerTitle, { color: theme.buttonText, fontSize: scale.titleSize }]}>
                Preview style
              </Text>

              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { 
                  paddingBottom: BOTTOM_ACTION_HEIGHT + insets.bottom + 16,
                  paddingHorizontal: Math.max(width * 0.05, 16),
                },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Premium Therapist Info Card */}
              <View style={[
                styles.infoCard, 
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  padding: scale.cardPadding,
                  marginBottom: isSmallDevice ? 12 : 16,
                }
              ]}>
                <View style={styles.infoHeader}>
                  <View style={[
                    styles.avatarContainer,
                    {
                      width: scale.avatarSize,
                      height: scale.avatarSize,
                      borderRadius: scale.avatarSize / 2,
                    }
                  ]}>
                    <Image
                      source={persona.image}
                      style={[
                        styles.avatar,
                        {
                          width: scale.avatarSize,
                          height: scale.avatarSize,
                          borderRadius: scale.avatarSize / 2,
                        }
                      ]}
                      resizeMode="cover"
                      accessible={true}
                      accessibilityLabel={`${persona.name} avatar`}
                    />
                  </View>
                  <View style={styles.infoHeaderText}>
                    <Text
                      style={[
                        styles.therapistName, 
                        { 
                          color: theme.textPrimary,
                          fontSize: scale.nameSize,
                        }
                      ]}
                    >
                      {previewContent.title}
                    </Text>
                    <Text
                      style={[
                        styles.styleLabel, 
                        { 
                          color: theme.primary,
                          fontSize: scale.subtitleSize,
                        }
                      ]}
                    >
                      {previewContent.subtitle}
                    </Text>
                  </View>
                </View>

                <Text style={[
                  styles.description, 
                  { 
                    color: theme.textSecondary,
                    fontSize: scale.descriptionSize,
                  }
                ]}>
                  {previewContent.description}
                </Text>
              </View>

              {/* Example Conversation Card with Soft Background */}
              <View style={[
                styles.conversationPanel,
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: scale.cardPadding,
                  marginBottom: isSmallDevice ? 12 : 16,
                }
              ]}>
                <Text style={[
                  styles.sectionTitle, 
                  { 
                    color: theme.textPrimary,
                    fontSize: scale.sectionTitleSize,
                  }
                ]}>
                  Example conversation
                </Text>

                <View style={[
                  styles.conversationContainer,
                  { backgroundColor: theme.background + '40' }
                ]}>
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
                  <Text style={[
                    styles.quickTipsTitle, 
                    { 
                      color: theme.textPrimary,
                      fontSize: scale.descriptionSize,
                    }
                  ]}>
                    What this feels like:
                  </Text>
                  {previewContent.quickTips.map((tip, index) => (
                    <View key={index} style={styles.quickTipRow}>
                      <Text style={[styles.quickTipBullet, { color: theme.primary }]}>•</Text>
                      <Text style={[
                        styles.quickTipText, 
                        { 
                          color: theme.textSecondary,
                          fontSize: isSmallDevice ? 13 : 14,
                        }
                      ]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={[
                  styles.disclaimer, 
                  { 
                    color: theme.textSecondary,
                    fontSize: isSmallDevice ? 11 : 12,
                  }
                ]}>
                  These are illustrative examples. Actual responses will vary based on your conversation.
                </Text>
              </View>

              {/* Try It Section */}
              <View style={[
                styles.tryItCard, 
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  padding: scale.cardPadding,
                  marginBottom: isSmallDevice ? 12 : 16,
                }
              ]}>
                <Text style={[
                  styles.sectionTitle, 
                  { 
                    color: theme.textPrimary,
                    fontSize: scale.sectionTitleSize,
                  }
                ]}>
                  Try it yourself
                </Text>

                <Text style={[
                  styles.tryItDescription, 
                  { 
                    color: theme.textSecondary,
                    fontSize: scale.descriptionSize,
                  }
                ]}>
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
                        fontSize: scale.descriptionSize,
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
                      { 
                        backgroundColor: theme.primary,
                        height: scale.buttonHeight - 6,
                      },
                      !tryItInput.trim() && styles.tryItButtonDisabled,
                    ]}
                    onPress={handleTryIt}
                    disabled={!tryItInput.trim()}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.tryItButtonText,
                      { fontSize: isSmallDevice ? 15 : 16 }
                    ]}>
                      Preview response
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Fixed Bottom Action Bar */}
            <View
              style={[
                styles.bottomActions,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  paddingBottom: insets.bottom + 16,
                  paddingHorizontal: Math.max(width * 0.05, 16),
                  boxShadow: '0px -2px 12px rgba(0, 0, 0, 0.08)',
                  elevation: 8,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.useButton, 
                  { 
                    backgroundColor: theme.primary,
                    height: scale.buttonHeight,
                  }
                ]}
                onPress={handleUseThisStyle}
                disabled={isUpdating}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={`Use ${persona.name} as your therapist`}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.useButtonText,
                  { fontSize: isSmallDevice ? 16 : 18 }
                ]}>
                  {isUpdating ? 'Updating...' : 'Use this style'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelButton, 
                  { 
                    borderColor: theme.textSecondary + '80',
                    height: scale.buttonHeight,
                  }
                ]}
                onPress={handleBack}
                disabled={isUpdating}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Go back without changing"
                accessibilityRole="button"
              >
                <Text style={[
                  styles.cancelButtonText, 
                  { 
                    color: theme.textSecondary,
                    fontSize: isSmallDevice ? 15 : 16,
                  }
                ]}>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 8,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  headerTitle: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingTop: 12,
  },
  infoCard: {
    borderRadius: 20,
    boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.08)',
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.12)',
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    backgroundColor: '#F5F5F5',
  },
  infoHeaderText: {
    flex: 1,
  },
  therapistName: {
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  styleLabel: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  description: {
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  conversationPanel: {
    borderRadius: 20,
    boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.08)',
    elevation: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  conversationContainer: {
    borderRadius: 16,
    padding: 16,
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
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  quickTipsTitle: {
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  quickTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4,
  },
  quickTipBullet: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
    marginTop: -1,
  },
  quickTipText: {
    flex: 1,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  disclaimer: {
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  tryItCard: {
    borderRadius: 20,
    boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.08)',
    elevation: 4,
  },
  tryItDescription: {
    lineHeight: 20,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  tryItMessagesContainer: {
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  tryItInputContainer: {
    marginBottom: 0,
  },
  tryItInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  tryItButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  tryItButtonDisabled: {
    opacity: 0.4,
  },
  tryItButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  useButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.12)',
    elevation: 5,
  },
  useButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cancelButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontWeight: '600',
    letterSpacing: 0.3,
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
