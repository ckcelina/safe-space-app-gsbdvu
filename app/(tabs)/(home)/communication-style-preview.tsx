
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useLocalSearchParams, router } from 'expo-router';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { showSuccessToast } from '@/utils/toast';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPersonaById, getPreviewContentById } from '@/constants/TherapistPersonas';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 20,
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
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    marginVertical: 8,
  },
});

export default function CommunicationStylePreviewScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { updatePreferences } = useUserPreferences();
  const { width } = useWindowDimensions();

  const persona = getPersonaById(personaId || 'dr-elias');
  const previewContent = getPreviewContentById(personaId || 'dr-elias');

  const handleSelect = useCallback(async () => {
    await updatePreferences({ therapistPersonaId: personaId || 'dr-elias' });
    showSuccessToast(`${persona.name} selected as your therapist`);
    router.back();
  }, [personaId, persona.name, updatePreferences]);

  // Generate valid timestamps for preview messages
  const now = new Date();
  const getTimestamp = (minutesAgo: number) => {
    const date = new Date(now.getTime() - minutesAgo * 60000);
    return date.toISOString();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol 
              ios_icon_name="chevron.left" 
              android_material_icon_name="arrow-back" 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSelect}
            style={[styles.selectButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <Text style={[styles.selectButtonText, { color: '#FFFFFF' }]}>Select</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Preview Messages */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {previewContent.map((message, index) => (
            <View key={index} style={styles.messageContainer}>
              <AnimatedChatBubble
                content={message.content}
                isUser={message.sender === 'user'}
                timestamp={getTimestamp((previewContent.length - index) * 2)}
                therapistName={persona.name}
                therapistAvatarSource={persona.avatarSource}
                theme={theme}
                screenWidth={width}
              />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
