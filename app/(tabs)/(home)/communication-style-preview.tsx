
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
      {/* Background gradient - positioned absolutely, doesn't block touches */}
      <LinearGradient
        colors={theme.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="chevron.left" 
              android_material_icon_name="arrow-back" 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {persona.name}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {persona.label}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSelect}
            style={[styles.selectButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            activeOpacity={0.7}
          >
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Preview Messages */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {previewContent.map((message, index) => (
            <View key={`preview-${index}`} style={styles.messageContainer}>
              <AnimatedChatBubble
                message={message.content}
                isUser={message.sender === 'user'}
                timestamp={getTimestamp((previewContent.length - index) * 2)}
                animate={false}
                therapistName={persona.name}
                therapistAvatarSource={persona.image}
                therapistPersonaId={persona.id}
              />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5%',
    paddingVertical: 12,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: '5%',
    paddingTop: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
});
