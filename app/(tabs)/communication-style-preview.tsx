
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getPreviewContentById, getPersonaDisplayName } from '@/constants/TherapistPersonas';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';

// Hardcoded fallback preview content
const DEFAULT_PREVIEW_CONTENT = {
  userMessage: "I've been feeling really overwhelmed lately with everything going on.",
  aiResponse: "I hear you. Feeling overwhelmed is completely valid, especially when life feels like it's coming at you from all directions. Let's take a moment together—what's weighing on you most right now?",
};

export default function CommunicationStylePreview() {
  const insets = useSafeAreaInsets();
  const { themeKey, theme: contextTheme } = useThemeContext();
  const params = useLocalSearchParams();
  
  // Safely normalize personaId
  const personaId = typeof params.personaId === 'string' 
    ? params.personaId 
    : Array.isArray(params.personaId) 
    ? params.personaId[0] 
    : undefined;

  // Ensure theme is always defined with safe defaults
  const theme = useMemo(() => {
    if (contextTheme && contextTheme.background) {
      return contextTheme;
    }
    // Fallback theme if context theme is undefined
    return {
      background: ['#667eea', '#764ba2'],
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.8)',
      card: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.2)',
      primary: '#FFFFFF',
    };
  }, [contextTheme]);

  // Get preview content with fallback
  const previewContent = useMemo(() => {
    if (!personaId) {
      return DEFAULT_PREVIEW_CONTENT;
    }
    
    try {
      const content = getPreviewContentById(personaId);
      // Ensure content has required fields
      if (!content || !content.userMessage || !content.aiResponse) {
        return DEFAULT_PREVIEW_CONTENT;
      }
      return content;
    } catch (error) {
      console.warn('Failed to load preview content:', error);
      return DEFAULT_PREVIEW_CONTENT;
    }
  }, [personaId]);

  const personaName = useMemo(() => {
    if (!personaId) return 'Therapist';
    try {
      return getPersonaDisplayName(personaId) || 'Therapist';
    } catch {
      return 'Therapist';
    }
  }, [personaId]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings');
    }
  };

  // Generate valid timestamps for preview
  const now = Date.now();
  const userTimestamp = new Date(now - 60000).toISOString(); // 1 min ago
  const aiTimestamp = new Date(now - 30000).toISOString(); // 30 sec ago

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.background}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Preview: {personaName}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              Communication Style Preview
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              This is how {personaName} would respond to you in a conversation.
            </Text>
          </View>

          {/* Chat Preview */}
          <View style={styles.chatContainer}>
            {/* User Message */}
            <AnimatedChatBubble
              message={previewContent.userMessage}
              isUser={true}
              timestamp={userTimestamp}
              theme={theme}
              index={0}
            />

            {/* AI Message */}
            <AnimatedChatBubble
              message={previewContent.aiResponse}
              isUser={false}
              timestamp={aiTimestamp}
              theme={theme}
              index={1}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
  },
  chatContainer: {
    marginBottom: 24,
  },
});
