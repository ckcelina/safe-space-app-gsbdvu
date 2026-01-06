import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@react-navigation/native';

// Safe persona data retrieval
function getPreviewForPersona(personaId: string | null) {
  // Add your persona-specific preview content here
  const previews: Record<string, { userMessage: string; therapistMessage: string }> = {
    therapist: {
      userMessage: "I've been feeling overwhelmed lately.",
      therapistMessage: "I'm here with you. Want to tell me what's been weighing on you most?"
    },
    // Add more personas as needed
  };
  
  return personaId && previews[personaId] ? previews[personaId] : null;
}

export default function CommunicationStylePreview() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  
  // Safely normalize personaId
  const personaId = Array.isArray(params.personaId) 
    ? params.personaId[0] 
    : params.personaId || null;
  
  // Get preview content with safe fallback
  const previewContent = getPreviewForPersona(personaId) ?? {
    userMessage: "I've been feeling overwhelmed lately.",
    therapistMessage: "I'm here with you. Want to tell me what's been weighing on you most?"
  };
  
  // Generate valid timestamps for preview
  const now = Date.now();
  const userTimestamp = new Date(now - 60000).toISOString(); // 1 min ago
  const therapistTimestamp = new Date(now - 30000).toISOString(); // 30 sec ago

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol 
            ios_icon_name="chevron.left" 
            android_material_icon_name="arrow-back" 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Preview Style</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.chatContainer}>
        <AnimatedChatBubble
          message={previewContent.userMessage}
          sender="user"
          timestamp={userTimestamp}
          theme={theme}
        />
        <AnimatedChatBubble
          message={previewContent.therapistMessage}
          sender="ai"
          timestamp={therapistTimestamp}
          theme={theme}
        />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    paddingTop: 20,
  },
});
