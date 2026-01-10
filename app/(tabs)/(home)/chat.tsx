
import { captureMemoriesFromMessage } from '@/lib/memoryCapture';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { getPersonaById, DEFAULT_PERSONA_ID } from '@/constants/TherapistPersonas';
import { useThemeContext } from '@/contexts/ThemeContext';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { AnimatedTypingIndicator } from '@/components/ui/AnimatedTypingIndicator';
import { extractMemoriesFromUserText } from '@/lib/memory/localExtract';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { memoryCache } from '@/lib/cache/memoryCache';
import { Message } from '@/types/database.types';
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
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { upsertPersonMemories } from '@/lib/memory/personMemory';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { getRecommendedTherapistForTopic, isTherapistOptimalForTopic } from '@/constants/TopicTherapistMapping';
import { supabase } from '@/lib/supabase';
import { FullScreenSwipeHandler } from '@/components/ui/FullScreenSwipeHandler';
import { pickAndUploadImage, takePhotoAndUpload } from '@/utils/imageUpload';
import { ChatImageBubble } from '@/components/ui/ChatImageBubble';
import { Ionicons } from '@expo/vector-icons';

interface ExtendedMessage extends Message {
  therapist_name?: string;
  therapist_avatar_source?: ImageSourcePropType;
  failed_to_send?: boolean;
  retry_content?: string;
  optimistic?: boolean;
  temp_id?: string;
  is_system_message?: boolean;
}

type MessageListItem = ExtendedMessage | { type: 'date_separator'; label: string; id: string };

interface SubjectPillProps {
  subject: string;
  isSelected: boolean;
  onPress: (subject: string) => void;
  isAddButton?: boolean;
}

const DEFAULT_SUBJECTS = ['General', 'Work', 'Family', 'Relationships', 'Health'];
const THERAPIST_SWITCH_WARNING_KEY = 'therapist_switch_warning_dismissed';
const DISMISSED_SUGGESTIONS_KEY = 'dismissed_therapist_suggestions';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  subjectsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  attachButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  therapistSwitchBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  therapistSwitchContent: {
    flex: 1,
  },
  therapistSwitchTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  therapistSwitchText: {
    fontSize: 13,
    lineHeight: 18,
  },
  therapistSwitchClose: {
    padding: 4,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
  },
});

function getDateSeparatorLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function transformMessagesWithSeparators(messages: Array<ExtendedMessage>): Array<MessageListItem> {
  const result: Array<MessageListItem> = [];
  let lastDate: Date | null = null;

  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at);
    if (!lastDate || !isSameDay(msgDate, lastDate)) {
      result.push({
        type: 'date_separator',
        label: getDateSeparatorLabel(msgDate),
        id: `separator_${msg.created_at}`,
      });
      lastDate = msgDate;
    }
    result.push(msg);
  });

  return result;
}

function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function mergeMessages(
  existing: Array<ExtendedMessage>,
  incoming: Array<ExtendedMessage>
): Array<ExtendedMessage> {
  const merged = [...existing];
  
  incoming.forEach((incomingMsg) => {
    const existingIndex = merged.findIndex((m) => m.id === incomingMsg.id);
    if (existingIndex >= 0) {
      merged[existingIndex] = incomingMsg;
    } else {
      merged.push(incomingMsg);
    }
  });

  return merged.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

async function updatePersonActivity(
  userId: string,
  personId: string,
  activityType: 'opened' | 'message'
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const updateData: any = {};

    if (activityType === 'opened') {
      updateData.last_opened_at = now;
    } else if (activityType === 'message') {
      updateData.last_message_at = now;
    }

    const { error } = await supabase
      .from('persons')
      .update(updateData)
      .eq('id', personId)
      .eq('user_id', userId);

    if (error) {
      console.error('[updatePersonActivity] Error:', error);
    }
  } catch (err) {
    console.error('[updatePersonActivity] Unexpected error:', err);
  }
}

function SubjectPill({ subject, isSelected, onPress, isAddButton }: SubjectPillProps) {
  const { theme } = useThemeContext();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    onPress(subject);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: isSelected ? theme.primary : theme.card,
          borderWidth: 1,
          borderColor: isSelected ? theme.primary : theme.textSecondary + '40',
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: isSelected ? '600' : '500',
            color: isSelected ? theme.buttonText : theme.textPrimary,
          }}
        >
          {isAddButton ? '+ Add' : subject}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function DateSeparator({ label }: { label: string }) {
  const { theme } = useThemeContext();
  return (
    <View style={styles.dateSeparator}>
      <Text
        style={[
          styles.dateSeparatorText,
          {
            color: theme.textSecondary,
            backgroundColor: theme.card,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { personId, personName, initialSubject } = useLocalSearchParams<{
    personId: string;
    personName: string;
    initialSubject?: string;
  }>();

  const { authUser } = useAuth();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { preferences } = useUserPreferences();

  const [allMessages, setAllMessages] = useState<Array<ExtendedMessage>>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSubject, setCurrentSubject] = useState(initialSubject || 'General');
  const [subjects, setSubjects] = useState<Array<string>>(DEFAULT_SUBJECTS);
  const [showTherapistSwitchWarning, setShowTherapistSwitchWarning] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const lastTherapistIdRef = useRef<string | null>(null);

  const messageListItems = transformMessagesWithSeparators(allMessages);

  useEffect(() => {
    if (personId && personName) {
      console.log('[ChatScreen] Mounted with person:', { personId, personName });
    }
  }, [personId, personName]);

  const loadMessages = useCallback(async () => {
    if (!authUser?.id || !personId) {
      console.log('[ChatScreen] loadMessages: Missing authUser or personId');
      return;
    }

    try {
      setLoading(true);
      console.log('[ChatScreen] Loading messages for person:', personId);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('person_id', personId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[ChatScreen] Error loading messages:', error);
        showErrorToast('Failed to load messages');
        return;
      }

      console.log('[ChatScreen] Loaded messages:', data?.length || 0);
      setAllMessages(data || []);

      // Update person activity
      await updatePersonActivity(authUser.id, personId, 'opened');
    } catch (err) {
      console.error('[ChatScreen] Unexpected error loading messages:', err);
      showErrorToast('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, personId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Set up realtime subscription
  useEffect(() => {
    if (!authUser?.id || !personId) return;

    console.log('[ChatScreen] Setting up realtime subscription');

    const channel = supabase
      .channel(`messages:${personId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `person_id=eq.${personId}`,
        },
        (payload) => {
          console.log('[ChatScreen] Realtime INSERT:', payload.new);
          const newMessage = payload.new as Message;
          
          setAllMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) return prev;
            return mergeMessages(prev, [newMessage]);
          });
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      console.log('[ChatScreen] Cleaning up realtime subscription');
      channel.unsubscribe();
    };
  }, [authUser?.id, personId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!loading && messageListItems.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [loading, messageListItems.length]);

  // Get current therapist metadata
  const getCurrentTherapistMetadata = useCallback(() => {
    const therapistId = preferences.therapist_persona_id || DEFAULT_PERSONA_ID;
    const persona = getPersonaById(therapistId);
    return {
      therapistId,
      therapistName: persona?.name || 'Dr. Elias',
      therapistAvatar: persona?.avatar,
    };
  }, [preferences.therapist_persona_id]);

  // Check for therapist switch warning
  useEffect(() => {
    const checkTherapistSwitch = async () => {
      const currentTherapistId = preferences.therapist_persona_id || DEFAULT_PERSONA_ID;
      
      if (lastTherapistIdRef.current && lastTherapistIdRef.current !== currentTherapistId) {
        const dismissed = await AsyncStorage.getItem(THERAPIST_SWITCH_WARNING_KEY);
        if (!dismissed) {
          setShowTherapistSwitchWarning(true);
        }
      }
      
      lastTherapistIdRef.current = currentTherapistId;
    };

    checkTherapistSwitch();
  }, [preferences.therapist_persona_id]);

  const handleDismissTherapistWarning = async () => {
    setShowTherapistSwitchWarning(false);
    await AsyncStorage.setItem(THERAPIST_SWITCH_WARNING_KEY, 'true');
  };

  // Handle image attachment
  const handleImageAttachment = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handleTakePhoto();
          } else if (buttonIndex === 2) {
            await handlePickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Library', onPress: handlePickImage },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    if (!authUser?.id || !personId) return;

    setUploadingImage(true);
    try {
      const result = await takePhotoAndUpload(authUser.id, personId);
      
      if (!result.success || !result.storagePath) {
        showErrorToast(result.error || 'Failed to upload photo');
        return;
      }

      // Insert image message
      await insertImageMessage(result.storagePath);
    } catch (error: any) {
      console.error('[ChatScreen] Error taking photo:', error);
      showErrorToast('Failed to upload photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickImage = async () => {
    if (!authUser?.id || !personId) return;

    setUploadingImage(true);
    try {
      const result = await pickAndUploadImage(authUser.id, personId);
      
      if (!result.success || !result.storagePath) {
        showErrorToast(result.error || 'Failed to upload image');
        return;
      }

      // Insert image message
      await insertImageMessage(result.storagePath);
    } catch (error: any) {
      console.error('[ChatScreen] Error picking image:', error);
      showErrorToast('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const insertImageMessage = async (storagePath: string) => {
    if (!authUser?.id || !personId) return;

    try {
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: authUser.id,
          person_id: personId,
          role: 'user',
          type: 'image',
          image_url: storagePath,
          content: '[Image]',
          subject: currentSubject,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (messageError) {
        console.error('[ChatScreen] Error inserting image message:', messageError);
        showErrorToast('Failed to save image message');
        return;
      }

      console.log('[ChatScreen] Image message inserted:', messageData.id);

      // Update person activity
      await updatePersonActivity(authUser.id, personId, 'message');

      // Generate AI response
      await generateAIResponse();
      
      showSuccessToast('Image uploaded');
    } catch (error: any) {
      console.error('[ChatScreen] Error in insertImageMessage:', error);
      showErrorToast('Failed to save image message');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !authUser?.id || !personId || isGenerating) {
      return;
    }

    const messageContent = inputText.trim();
    setInputText('');

    try {
      // Insert user message
      const { data: userMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: authUser.id,
          person_id: personId,
          role: 'user',
          type: 'text',
          content: messageContent,
          subject: currentSubject,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('[ChatScreen] Error inserting message:', insertError);
        showErrorToast('Failed to send message');
        setInputText(messageContent);
        return;
      }

      console.log('[ChatScreen] User message inserted:', userMessage.id);

      // Update person activity
      await updatePersonActivity(authUser.id, personId, 'message');

      // Capture memories in background
      captureMemoriesFromMessage(authUser.id, personId, messageContent, personName || 'Unknown');

      // Generate AI response
      await generateAIResponse();
    } catch (error: any) {
      console.error('[ChatScreen] Error sending message:', error);
      showErrorToast('Failed to send message');
      setInputText(messageContent);
    }
  };

  const generateAIResponse = async () => {
    if (!authUser?.id || !personId || isGenerating) return;

    setIsGenerating(true);
    try {
      console.log('[ChatScreen] Generating AI response');

      // Get recent messages (last 10)
      const { data: recentMessages, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('person_id', personId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) {
        console.error('[ChatScreen] Error fetching recent messages:', fetchError);
        showErrorToast('Failed to generate response');
        return;
      }

      const messages = (recentMessages || []).reverse();

      // Get person details
      const { data: personData } = await supabase
        .from('persons')
        .select('name, relationship_type')
        .eq('id', personId)
        .single();

      const { therapistId } = getCurrentTherapistMetadata();

      // Call edge function
      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        'generate-ai-response',
        {
          body: {
            personId,
            personName: personData?.name || personName || 'Unknown',
            personRelationshipType: personData?.relationship_type,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
              type: m.type,
              image_url: m.image_url,
              createdAt: m.created_at,
            })),
            currentSubject,
            aiToneId: preferences.ai_tone_id,
            aiScienceMode: preferences.ai_science_mode,
            userId: authUser.id,
            therapistId,
          },
        }
      );

      if (aiError) {
        console.error('[ChatScreen] Edge function error:', aiError);
        showErrorToast('Failed to generate response');
        return;
      }

      const aiReply = aiData?.reply;
      if (!aiReply) {
        console.error('[ChatScreen] No reply from AI');
        showErrorToast('No response from AI');
        return;
      }

      console.log('[ChatScreen] AI reply received, length:', aiReply.length);

      // Insert AI message
      const { therapistName, therapistAvatar } = getCurrentTherapistMetadata();

      const { error: aiInsertError } = await supabase
        .from('messages')
        .insert({
          user_id: authUser.id,
          person_id: personId,
          role: 'assistant',
          type: 'text',
          content: aiReply,
          subject: currentSubject,
          created_at: new Date().toISOString(),
        });

      if (aiInsertError) {
        console.error('[ChatScreen] Error inserting AI message:', aiInsertError);
        showErrorToast('Failed to save AI response');
      }
    } catch (error: any) {
      console.error('[ChatScreen] Error generating AI response:', error);
      showErrorToast('Failed to generate response');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMessage = ({ item }: ListRenderItemInfo<MessageListItem>) => {
    if ('type' in item && item.type === 'date_separator') {
      return <DateSeparator label={item.label} />;
    }

    const message = item as ExtendedMessage;
    const isUser = message.role === 'user';

    // Render image message
    if (message.type === 'image' && message.image_url) {
      return (
        <View style={{ marginBottom: 12 }}>
          <ChatImageBubble imageUrl={message.image_url} isUser={isUser} />
        </View>
      );
    }

    // Render text message
    return (
      <AnimatedChatBubble
        message={message.content}
        isUser={isUser}
        timestamp={message.created_at}
        therapistName={message.therapist_name}
        therapistAvatar={message.therapist_avatar_source}
      />
    );
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  if (loading) {
    return <LoadingOverlay visible={loading} />;
  }

  return (
    <FullScreenSwipeHandler onSwipeRight={() => router.back()}>
      <LinearGradient colors={[theme.background, theme.background]} style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow-back"
                  size={24}
                  color={theme.textPrimary}
                />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {personName || 'Chat'}
              </Text>
            </View>
          </View>

          {/* Subject Pills */}
          <View style={styles.subjectsContainer}>
            {subjects.map((subject) => (
              <SubjectPill
                key={subject}
                subject={subject}
                isSelected={currentSubject === subject}
                onPress={setCurrentSubject}
              />
            ))}
          </View>
        </View>

        {/* Therapist Switch Warning */}
        {showTherapistSwitchWarning && (
          <View
            style={[
              styles.therapistSwitchBanner,
              { backgroundColor: theme.card },
            ]}
          >
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={20}
              color={theme.primary}
            />
            <View style={styles.therapistSwitchContent}>
              <Text style={[styles.therapistSwitchTitle, { color: theme.textPrimary }]}>
                Therapist Changed
              </Text>
              <Text style={[styles.therapistSwitchText, { color: theme.textSecondary }]}>
                You&apos;ve switched to a different therapist. They&apos;ll have their own unique approach.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.therapistSwitchClose}
              onPress={handleDismissTherapistWarning}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={16}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messageListItems}
          renderItem={renderMessage}
          keyExtractor={(item) => ('id' in item ? item.id : item.id)}
          contentContainerStyle={styles.messagesContent}
          style={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="bubble.left.and.bubble.right"
                android_material_icon_name="chat"
                size={48}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Start a conversation about {personName}
              </Text>
            </View>
          }
        />

        {/* Typing Indicator */}
        {isGenerating && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <AnimatedTypingIndicator />
          </View>
        )}

        {/* Uploading Indicator */}
        {uploadingImage && (
          <View style={[styles.uploadingIndicator, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.uploadingText, { color: theme.textSecondary }]}>
              Uploading image...
            </Text>
          </View>
        )}

        {/* Input Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.background,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
              },
            ]}
          >
            {/* Image Attachment Button */}
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleImageAttachment}
              disabled={isGenerating || uploadingImage}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color={isGenerating || uploadingImage ? theme.textSecondary : theme.primary}
              />
            </TouchableOpacity>

            {/* Text Input */}
            <View style={[styles.inputWrapper, { backgroundColor: theme.card }]}>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor={theme.textSecondary}
                multiline
                maxLength={1000}
                editable={!isGenerating && !uploadingImage}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputText.trim() && !isGenerating && !uploadingImage
                      ? theme.primary
                      : theme.textSecondary + '40',
                },
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isGenerating || uploadingImage}
            >
              <IconSymbol
                ios_icon_name="arrow.up"
                android_material_icon_name="send"
                size={20}
                color={theme.buttonText}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </FullScreenSwipeHandler>
  );
}
