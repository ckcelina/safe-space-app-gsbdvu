
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { extractMemoriesFromUserText } from '@/lib/memory/localExtract';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { getPersonaById, DEFAULT_PERSONA_ID, getPreviewContentById } from '@/constants/TherapistPersonas';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { memoryCache } from '@/lib/cache/memoryCache';
import { FullScreenSwipeHandler } from '@/components/ui/FullScreenSwipeHandler';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { upsertPersonMemories } from '@/lib/memory/personMemory';
import { Message } from '@/types/database.types';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { showErrorToast } from '@/utils/toast';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Modal,
  ImageSourcePropType,
  AppState,
  AppStateStatus,
} from 'react-native';
import { AnimatedTypingIndicator } from '@/components/ui/AnimatedTypingIndicator';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { captureMemoriesFromMessage } from '@/lib/memoryCapture';

interface ExtendedMessage extends Message {
  therapist_name?: string;
  therapist_avatar_source?: ImageSourcePropType;
  failed_to_send?: boolean;
  retry_content?: string;
  optimistic?: boolean;
  temp_id?: string;
}

type MessageListItem =
  | { type: 'date-separator'; label: string; id: string }
  | { type: 'message'; message: ExtendedMessage };

interface SubjectPillProps {
  subject: string;
  isSelected: boolean;
  onPress: (subject: string) => void;
  isAddButton?: boolean;
}

const DEFAULT_SUBJECTS = [
  'General',
  'Work',
  'Family',
  'Health',
  'Relationships',
];

// ... rest of the existing helper functions remain the same ...

const ChatScreen = () => {
  // ... all existing state and hooks remain the same ...

  const handleOpenPreview = useCallback(() => {
    const previewContent = getPreviewContentById(currentTherapistId);
    if (!previewContent) return;

    const now = new Date().toISOString();
    const previewMessages: ExtendedMessage[] = previewContent.map((msg, idx) => ({
      id: `preview-${idx}`,
      user_id: authUser?.id || '',
      person_id: personId,
      sender: msg.sender,
      content: msg.content,
      created_at: now,
      subject: currentSubject,
      therapist_name: msg.sender === 'ai' ? currentTherapistName : undefined,
      therapist_avatar_source: msg.sender === 'ai' ? currentTherapistAvatar : undefined,
    }));

    setPreviewMessages(previewMessages);
    setShowPreviewModal(true);
  }, [currentTherapistId, personId, authUser?.id, currentSubject, currentTherapistName, currentTherapistAvatar]);

  // ... rest of the component remains the same ...

  return (
    <FullScreenSwipeHandler onSwipeRight={handleBack} enabled={!showPreviewModal}>
      {/* ... existing JSX ... */}
      
      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={[styles.previewContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.previewHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
              Preview: {currentTherapistName}
            </Text>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <IconSymbol name="xmark" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={previewMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedChatBubble
                message={item.content}
                isUser={item.sender === 'user'}
                timestamp={item.created_at}
                theme={theme}
                index={index}
                therapistName={item.therapist_name}
              />
            )}
            contentContainerStyle={styles.previewList}
          />
        </View>
      </Modal>
    </FullScreenSwipeHandler>
  );
};

const styles = StyleSheet.create({
  // ... all existing styles remain the same ...
});

export default ChatScreen;
