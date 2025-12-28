
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
import { getPersonaById } from '@/constants/TherapistPersonas';
import { showSuccessToast } from '@/utils/toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Static preview conversations for each therapist persona
const PREVIEW_CONVERSATIONS: Record<string, Array<{ role: 'user' | 'assistant'; content: string }>> = {
  dr_elias: [
    { role: 'user', content: "I'm feeling really overwhelmed right now. Everything feels like too much." },
    { role: 'assistant', content: "Let's take a breath for a moment. It's okay to feel overwhelmed. You're safe here, and we can take this one step at a time." },
    { role: 'user', content: "I don't even know where to start." },
    { role: 'assistant', content: "That's completely understandable. When everything feels heavy, it can be hard to see a starting point. What would help you feel more grounded right now?" },
  ],
  noah: [
    { role: 'user', content: "I keep having the same argument with my partner. I don't know what to do." },
    { role: 'assistant', content: "Okay. Here's the clean version: What patterns are you noticing in these arguments? What usually triggers them?" },
    { role: 'user', content: "It's always about household chores. They never seem to do their share." },
    { role: 'assistant', content: "Let's break this down into clear steps. Have you both agreed on what 'fair share' means? What's the most practical next move to address this?" },
  ],
  maya: [
    { role: 'user', content: "I feel like I'm not good enough at my job. Everyone else seems so much better." },
    { role: 'assistant', content: "That sounds really heavy to carry. It makes complete sense that you'd feel this way when you're comparing yourself to others. Your feelings are valid." },
    { role: 'user', content: "I just feel like I'm always behind." },
    { role: 'assistant', content: "It's okay to feel this way. Comparing ourselves to others can be so painful. I'm here with you in this. What would it feel like to be gentle with yourself right now?" },
  ],
  claire: [
    { role: 'user', content: "I said yes to something I didn't want to do, and now I'm angry at myself." },
    { role: 'assistant', content: "Something in what you said feels important. What do you notice when you reflect on why you said yes?" },
    { role: 'user', content: "I guess I didn't want to disappoint them." },
    { role: 'assistant', content: "I'm curious—what does this pattern tell you about how you relate to others? What does that bring up for you?" },
  ],
  ruth: [
    { role: 'user', content: "I'm exhausted. I feel like I'm doing everything for everyone and nothing for myself." },
    { role: 'assistant', content: "Oh love, of course you feel this way. You're carrying so much. It's okay to need support. That's what I'm here for." },
    { role: 'user', content: "I just don't know how to say no." },
    { role: 'assistant', content: "You're doing better than you think. Learning to set boundaries is hard, but you're already taking the first step by recognizing this. Be gentle with yourself today." },
  ],
  jordan: [
    { role: 'user', content: "I failed my exam. I feel like such a failure." },
    { role: 'assistant', content: "I'm proud of you for saying that out loud. Look at how far you've already come—you showed up, you tried, and you're still here. That takes strength." },
    { role: 'user', content: "But I studied so hard." },
    { role: 'assistant', content: "And that effort matters. One exam doesn't define you. You have the strength to handle this. What's one thing you're proud of today? You've got this—small steps count." },
  ],
  aisha: [
    { role: 'user', content: "I'm stuck in the same routine and I hate it, but I don't know how to change." },
    { role: 'assistant', content: "Can I get curious with you for a second? What if we looked at this from a different angle? What's keeping the routine in place?" },
    { role: 'user', content: "I guess it feels safe, even though I don't like it." },
    { role: 'assistant', content: "That's really insightful. I'm curious—what else might be going on here? What would it feel like to try something small and different? What else are you noticing?" },
  ],
  ken: [
    { role: 'user', content: "I know I should be happy, but I just feel empty inside." },
    { role: 'assistant', content: "Let's break this down logically: You're experiencing a disconnect between what you think you should feel and what you actually feel. How do your emotions and the facts fit together here?" },
    { role: 'user', content: "I have everything I wanted, but it doesn't feel like I thought it would." },
    { role: 'assistant', content: "Let's connect what you're feeling with what's happening. Sometimes our expectations don't match reality. What makes sense to you when you think it through? Does that framework help?" },
  ],
};

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
  const [tryItResponse, setTryItResponse] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get persona data
  const persona = getPersonaById(therapistPersonaId);

  // Get preview conversation
  const previewConversation = PREVIEW_CONVERSATIONS[therapistPersonaId] || [];

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
    if (!input) return;

    // Generate a simple local response based on the persona style
    // This is a simplified version and doesn't call the AI
    let response = '';

    switch (therapistPersonaId) {
      case 'dr_elias':
        response = "Let's take a moment to slow down. I hear what you're saying, and it's okay to feel this way.";
        break;
      case 'noah':
        response = "Okay. Let's break this down. What's the most important part of what you just shared?";
        break;
      case 'maya':
        response = "That sounds really difficult. Your feelings make complete sense given what you're experiencing.";
        break;
      case 'claire':
        response = "I'm curious—what do you notice when you reflect on that? What does it bring up for you?";
        break;
      case 'ruth':
        response = "Oh love, of course you feel this way. You're doing better than you think. Be gentle with yourself.";
        break;
      case 'jordan':
        response = "I'm proud of you for sharing that. You have the strength to handle this. What's one small step you can take?";
        break;
      case 'aisha':
        response = "Can I get curious with you for a second? What if we looked at this from a different angle?";
        break;
      case 'ken':
        response = "Let's connect what you're feeling with what's happening. How do your emotions and the facts fit together here?";
        break;
      default:
        response = "I hear you. Can you tell me more about what you're experiencing?";
    }

    setTryItResponse(response);
    setTryItInput('');
  }, [tryItInput, therapistPersonaId]);

  if (!persona) {
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
                      {persona.name}
                    </Text>
                    <Text style={[styles.styleLabel, { color: theme.primary }]}>
                      {persona.label}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.description, { color: theme.textSecondary }]}>
                  {persona.short_description}
                </Text>
              </View>

              {/* Preview Conversation */}
              <View style={[styles.previewCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Example conversation
                </Text>

                <View style={styles.conversationContainer}>
                  {previewConversation.map((message, index) => (
                    <View key={index} style={styles.messageWrapper}>
                      <AnimatedChatBubble
                        message={message.content}
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
                    placeholder="Type your message here..."
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
                    <Text style={styles.tryItButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>

                {tryItResponse && (
                  <View style={styles.tryItResponseContainer}>
                    <AnimatedChatBubble
                      message={tryItResponse}
                      isUser={false}
                      timestamp={undefined}
                      animate={true}
                      therapistName={persona.name}
                      therapistAvatarSource={persona.image}
                      therapistPersonaId={therapistPersonaId}
                    />
                  </View>
                )}
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
    marginBottom: 16,
  },
  messageWrapper: {
    width: '100%',
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
  tryItInputContainer: {
    marginBottom: 16,
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
  tryItResponseContainer: {
    marginTop: 16,
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
