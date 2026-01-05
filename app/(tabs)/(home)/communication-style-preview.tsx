
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { showSuccessToast } from '@/utils/toast';
import React, { useState, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { useLocalSearchParams, router } from 'expo-router';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getPersonaById, getPreviewContentById } from '@/constants/TherapistPersonas';
import { useThemeContext } from '@/contexts/ThemeContext';
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

const CommunicationStylePreviewScreen = () => {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { preferences, updatePreferences } = useUserPreferences();
  const [userInput, setUserInput] = useState('');

  const persona = getPersonaById(personaId || 'dr-elias');
  const previewContent = getPreviewContentById(personaId || 'dr-elias');

  // Generate preview messages with valid timestamps
  const previewMessages = [
    {
      sender: 'user' as const,
      content: previewContent.userMessage,
      timestamp: Date.now() - 60000, // 1 minute ago
    },
    {
      sender: 'ai' as const,
      content: previewContent.aiResponse,
      timestamp: Date.now() - 30000, // 30 seconds ago
      therapist_name: persona.name,
      therapist_avatar_source: persona.avatarSource,
    },
  ];

  const handleSelectPersona = useCallback(async () => {
    await updatePreferences({ aiPreference: personaId || 'dr-elias' });
    showSuccessToast(`Communication style set to ${persona.name}`);
    router.back();
  }, [personaId, persona.name, updatePreferences]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '20', theme.colors.background]}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Preview Style</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.personaCard}>
            <Image source={persona.avatarSource} style={styles.personaAvatar} />
            <Text style={[styles.personaName, { color: theme.colors.text }]}>{persona.name}</Text>
            <Text style={[styles.personaDescription, { color: theme.colors.textSecondary }]}>
              {persona.description}
            </Text>
          </View>

          <View style={styles.chatPreview}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Conversation Preview
            </Text>
            {previewMessages.map((msg, index) => (
              <AnimatedChatBubble key={index} message={msg} index={index} />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: theme.colors.primary }]}
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
});

export default CommunicationStylePreviewScreen;
