
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { showSuccessToast } from '@/utils/toast';
import { IconSymbol } from '@/components/IconSymbol';
import { useLocalSearchParams, router } from 'expo-router';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getPersonaById, getPreviewContentById } from '@/constants/TherapistPersonas';
import { useThemeContext } from '@/contexts/ThemeContext';

// Hardcoded fallback preview content
const DEFAULT_PREVIEW_CONTENT = {
  userMessage: "I've been feeling really overwhelmed lately with everything going on.",
  aiResponse: "I hear you. Feeling overwhelmed is completely valid, especially when life feels like it's coming at you from all directions. Let's take a moment together—what's weighing on you most right now?",
};

const CommunicationStylePreviewScreen = () => {
  const params = useLocalSearchParams();
  const { theme: contextTheme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { preferences, updatePreferences } = useUserPreferences();

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

  // Safely normalize personaId from route params
  const personaId = useMemo(() => {
    const rawId = params.therapistPersonaId || params.personaId;
    if (Array.isArray(rawId)) {
      return rawId[0] || undefined;
    }
    return rawId || undefined;
  }, [params]);

  // Get persona with safe fallback
  const persona = useMemo(() => {
    if (!personaId) {
      return getPersonaById('dr_elias');
    }
    return getPersonaById(personaId) || getPersonaById('dr_elias');
  }, [personaId]);
  
  // Get preview content with safe fallback
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

  // Generate preview messages with valid timestamps
  const previewMessages = useMemo(() => {
    const now = Date.now();
    return [
      {
        sender: 'user' as const,
        content: previewContent.userMessage,
        timestamp: new Date(now - 60000).toISOString(), // 1 minute ago
      },
      {
        sender: 'ai' as const,
        content: previewContent.aiResponse,
        timestamp: new Date(now - 30000).toISOString(), // 30 seconds ago
        therapist_name: persona?.name,
        therapist_avatar_source: persona?.image,
      },
    ];
  }, [previewContent, persona]);

  const handleSelectPersona = useCallback(async () => {
    if (!persona) return;
    
    await updatePreferences({ therapist_persona_id: persona.id });
    showSuccessToast(`Communication style set to ${persona.name}`);
    router.back();
  }, [persona, updatePreferences]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings');
    }
  };

  // Fallback UI if persona not found
  if (!persona) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background[1] || theme.background }]}>
        <LinearGradient
          colors={theme.background}
          style={styles.gradient}
        />
        
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <IconSymbol 
                ios_icon_name="chevron.left" 
                android_material_icon_name="arrow-back" 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Preview Style</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.text }]}>
              Persona not found. Please go back and try again.
            </Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: theme.primary }]}
              onPress={handleBack}
            >
              <Text style={styles.selectButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background[1] || theme.background }]}>
      <LinearGradient
        colors={theme.background}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <IconSymbol 
              ios_icon_name="chevron.left" 
              android_material_icon_name="arrow-back" 
              size={24} 
              color={theme.text} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Preview Style</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.personaCard}>
            <Image source={persona.image} style={styles.personaAvatar} />
            <Text style={[styles.personaName, { color: theme.text }]}>{persona.name}</Text>
            <Text style={[styles.personaDescription, { color: theme.textSecondary }]}>
              {persona.short_description}
            </Text>
          </View>

          <View style={styles.chatPreview}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Conversation Preview
            </Text>
            {previewMessages.map((msg, index) => (
              <AnimatedChatBubble 
                key={index} 
                message={msg.content}
                isUser={msg.sender === 'user'}
                timestamp={msg.timestamp}
                theme={theme}
                index={index}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: theme.primary }]}
            onPress={handleSelectPersona}
          >
            <Text style={styles.selectButtonText}>Select This Style</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  personaCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  personaAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  personaName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  personaDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chatPreview: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  selectButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default CommunicationStylePreviewScreen;
