
import { captureMemoriesFromMessage } from '@/lib/memoryCapture';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ChatBubble } from '@/components/ui/ChatBubble';
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

function transformMessagesWithSeparators(messages: ExtendedMessage[]): MessageListItem[] {
  const result: MessageListItem[] = [];
  let lastDate: Date | null = null;

  messages.forEach((msg) => {
    // Validate created_at exists before using it
    if (!msg.created_at) {
      console.warn('[transformMessagesWithSeparators] Message missing created_at:', msg.id);
      result.push(msg);
      return;
    }
    
    const msgDate = new Date(msg.created_at);
    
    // Validate date is valid
    if (isNaN(msgDate.getTime())) {
      console.warn('[transformMessagesWithSeparators] Invalid date:', msg.created_at, msg.id);
      result.push(msg);
      return;
    }
    
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
  existing: ExtendedMessage[],
  incoming: ExtendedMessage[]
): ExtendedMessage[] {
  const merged = [...existing];
  
  incoming.forEach((incomingMsg) => {
    if (!incomingMsg || !incomingMsg.id) {
      console.warn('[mergeMessages] Skipping message without id:', incomingMsg);
      return;
    }
    
    const existingIndex = merged.findIndex((m) => m.id === incomingMsg.id);
    if (existingIndex >= 0) {
      merged[existingIndex] = incomingMsg;
    } else {
      merged.push(incomingMsg);
    }
  });

  return merged.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });
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

  const { user: authUser } = useAuth();
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { preferences } = useUserPreferences();

  const [allMessages, setAllMessages] = useState<ExtendedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSubject, setCurrentSubject] = useState(initialSubject || 'General');
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [showTherapistSwitchWarning, setShowTherapistSwitchWarning] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const lastTherapistIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const messageListItems = transformMessagesWithSeparators(allMessages);
  
  // Debug logging for message flow - CRITICAL VISIBILITY
  useEffect(() => {
    console.error('🟡 [CRITICAL] Message state update:', {
      allMessagesCount: allMessages.length,
      messageListItemsCount: messageListItems.length,
      sampleMessage: allMessages[0] ? {
        id: allMessages[0].id,
        hasSender: 'sender' in allMessages[0],
        sender: allMessages[0].sender,
        hasRole: 'role' in allMessages[0],
        role: (allMessages[0] as any).role,
        content: allMessages[0].content?.substring(0, 50),
      } : null,
      lastMessageId: allMessages[allMessages.length - 1]?.id,
      timestamp: new Date().toISOString(),
    });
  }, [allMessages, messageListItems]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (personId && personName) {
      console.log('[ChatScreen] Mounted with person:', { personId, personName });
    }
    
    return () => {
      isMountedRef.current = false;
    };
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
      
      // Log sample message structure for debugging
      if (data && data.length > 0) {
        console.log('[DEBUG] Sample message structure:', {
          id: data[0].id,
          hasSender: 'sender' in data[0],
          sender: data[0].sender,
          hasRole: 'role' in data[0],
          role: data[0].role,
          hasContent: 'content' in data[0],
          hasType: 'type' in data[0],
          type: data[0].type,
          keys: Object.keys(data[0]),
        });
      }
      
      
      if (isMountedRef.current) {
        console.log('[DEBUG] Setting allMessages:', {
          messageCount: data?.length || 0,
          messages: data?.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            role: m.role,
            hasContent: !!m.content,
          })) || [],
        });
        setAllMessages(data || []);
      }

      // Update person activity
      await updatePersonActivity(authUser.id, personId, 'opened');
    } catch (err) {
      console.error('[ChatScreen] Unexpected error loading messages:', err);
      showErrorToast('Failed to load messages');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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
        (payload: any) => {
          console.log('[DEBUG] Realtime INSERT received:', {
            hasPayload: !!payload,
            hasNew: !!payload?.new,
            messageId: payload?.new?.id,
            sender: payload?.new?.sender,
            role: payload?.new?.role,
            hasContent: !!payload?.new?.content,
            payloadKeys: payload?.new ? Object.keys(payload.new) : [],
          });
          console.log('[ChatScreen] Realtime INSERT:', payload.new);
          
          const newMessage = payload.new as Message;
          
          if (!newMessage || !newMessage.id) {
            console.log('[DEBUG] Realtime INSERT: Invalid message - missing id or message object');
            console.warn('[ChatScreen] Realtime INSERT: Invalid message', payload.new);
            return;
          }
          
          setAllMessages((prev) => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) {
              console.log('[DEBUG] Component unmounted, skipping realtime update');
              return prev;
            }
            
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) {
              console.log('[DEBUG] Message already exists in state, skipping duplicate from realtime');
              return prev;
            }
            console.log('[DEBUG] Merging new message from realtime:', {
              messageId: newMessage.id,
              sender: newMessage.sender,
              prevCount: prev.length,
            });
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
      const timeoutId = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
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
      await takePhotoAndUpload();
      // Image upload not implemented yet
      showErrorToast('Photo capture not yet implemented');
      return;
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
      await pickAndUploadImage();
      // Image upload not implemented yet
      showErrorToast('Image picker not yet implemented');
      return;
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
      const imageInsertPayload: any = {
        user_id: authUser.id,
        person_id: personId,
        sender: 'user',
        type: 'image',
        image_url: storagePath,
        content: '[Image]',
        created_at: new Date().toISOString(),
      };
      // Only include subject if it exists (column may not exist in all databases)
      if (currentSubject) {
        imageInsertPayload.subject = currentSubject;
      }
      
      console.error('[DEBUG] Image insert payload:', JSON.stringify(imageInsertPayload, null, 2));
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert(imageInsertPayload)
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
    // CRITICAL: Always log when function is called (even before early returns)
    console.error('🔵 [CRITICAL] handleSendMessage CALLED', {
      hasInput: !!inputText.trim(),
      inputText: inputText.trim().substring(0, 50),
      hasAuthUser: !!authUser?.id,
      hasPersonId: !!personId,
      isGenerating,
      timestamp: new Date().toISOString(),
    });
    
    if (!inputText.trim() || !authUser?.id || !personId || isGenerating) {
      console.error('🔴 [CRITICAL] handleSendMessage EARLY RETURN', {
        hasInput: !!inputText.trim(),
        hasAuthUser: !!authUser?.id,
        hasPersonId: !!personId,
        isGenerating,
      });
      return;
    }

    const messageContent = inputText.trim();
    setInputText('');
    
    console.error('🟢 [CRITICAL] handleSendMessage PROCEEDING', {
      messageLength: messageContent.length,
      messageContent: messageContent.substring(0, 50),
      personId,
      userId: authUser?.id,
    });

    try {
      // Insert user message
      // Note: type and subject columns may not exist if migrations haven't been run
      const insertPayload: any = {
        user_id: authUser.id,
        person_id: personId,
        sender: 'user',
        content: messageContent,
        created_at: new Date().toISOString(),
      };
      // Only include optional columns if they exist or are needed
      // type column: added via migration, has default 'text', safe to omit for text messages
      // subject column: added via migration, optional
      if (currentSubject) {
        insertPayload.subject = currentSubject;
      }
      
      console.log('[DEBUG] Insert payload:', JSON.stringify(insertPayload, null, 2));
      
      const { data: userMessage, error: insertError } = await supabase
        .from('messages')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.log('[DEBUG] Insert error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          fullError: JSON.stringify(insertError, Object.getOwnPropertyNames(insertError)),
        });
        console.error('[ChatScreen] Error inserting message:', insertError);
        showErrorToast('Failed to send message');
        setInputText(messageContent);
        return;
      }

      console.error('🟢 [CRITICAL] User message inserted successfully:', {
        messageId: userMessage.id,
        sender: userMessage.sender,
        role: (userMessage as any).role,
        content: userMessage.content?.substring(0, 50),
        timestamp: new Date().toISOString(),
      });
      console.log('[ChatScreen] User message inserted:', userMessage.id);
      
      // Immediately update local state to show the message (don't wait for realtime)
      if (isMountedRef.current) {
        setAllMessages((prev) => {
          // Check if message already exists (from realtime or previous insert)
          const exists = prev.some((m) => m.id === userMessage.id);
          if (exists) {
            console.log('[DEBUG] Message already in state, skipping duplicate');
            return prev;
          }
          // Use mergeMessages to ensure proper sorting
          const updated = mergeMessages(prev, [userMessage as ExtendedMessage]);
          console.error('🟢 [CRITICAL] Immediately updating allMessages after insert:', {
            prevCount: prev.length,
            newCount: updated.length,
            insertedMessageId: userMessage.id,
            sorted: true,
            timestamp: new Date().toISOString(),
          });
          return updated;
        });
      }

      // Update person activity
      await updatePersonActivity(authUser.id, personId, 'message');

      // Capture memories in background
      captureMemoriesFromMessage(authUser.id, personId, messageContent);

      // Generate AI response
      await generateAIResponse();
    } catch (error: any) {
      console.error('[DEBUG] handleSendMessage CATCH BLOCK:', {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack?.substring(0, 500),
        errorKeys: error ? Object.keys(error) : [],
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2).substring(0, 1000),
      });
      console.error('[ChatScreen] Error sending message:', error);
      showErrorToast('Failed to send message');
      setInputText(messageContent);
    }
  };

  const generateAIResponse = async () => {
    console.log('[DEBUG] generateAIResponse called', { hasAuthUser: !!authUser?.id, hasPersonId: !!personId, isGenerating });
    
    if (!authUser?.id || !personId || isGenerating) {
      console.log('[DEBUG] generateAIResponse early return', { hasAuthUser: !!authUser?.id, hasPersonId: !!personId, isGenerating });
      return;
    }

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
      
      
      // Validate we have valid messages
      if (!messages || messages.length === 0) {
        console.error('[ChatScreen] No messages found for AI response');
        showErrorToast('No messages found');
        return;
      }
      
      // Filter and validate messages
      // Handle both 'sender' (current schema) and 'role' (legacy) fields for compatibility
      // Convert sender ('user' | 'ai') or role ('user' | 'assistant') to role ('user' | 'assistant') for edge function
      const validMessages = messages
        .filter((m: any) => {
          // Accept messages with either sender or role field (for backward compatibility)
          const hasSender = m?.sender === 'user' || m?.sender === 'ai';
          const hasRole = m?.role === 'user' || m?.role === 'assistant';
          const hasValidIdentifier = hasSender || hasRole;
          const hasContent = m?.content || m?.type === 'image';
          const isValid = m && hasValidIdentifier && hasContent;
          
          if (!isValid) {
            console.log('[DEBUG] Message filtered out:', {
              hasM: !!m,
              sender: m?.sender,
              role: m?.role,
              hasContent: !!m?.content,
              type: m?.type,
              messageId: m?.id,
            });
          }
          return isValid;
        })
        .map((m: any) => {
          // Determine if user message: check sender first, then role as fallback
          const isUserMessage = m.sender === 'user' || m.role === 'user';
          
          return {
            role: isUserMessage ? 'user' : 'assistant', // Convert 'ai' -> 'assistant' or 'assistant' -> 'assistant'
            content: m.content || (m.type === 'image' ? '[Image]' : ''),
            type: m.type || 'text',
            image_url: m.image_url || undefined,
            createdAt: m.created_at || new Date().toISOString(),
          };
        });
      
      
      if (validMessages.length === 0) {
        console.error('[ChatScreen] No valid messages after filtering');
        showErrorToast('Invalid message data');
        return;
      }

      // Get person details
      const { data: personData, error: personError } = await supabase
        .from('persons')
        .select('name, relationship_type')
        .eq('id', personId)
        .maybeSingle();
      
      if (personError) {
        console.error('[ChatScreen] Error fetching person data:', personError);
        // Continue with fallback values
      }

      const { therapistId } = getCurrentTherapistMetadata();


      // Call edge function
      let aiData: any = null;
      let aiError: any = null;
      
      try {
        console.log('[DEBUG] About to invoke edge function', { personId, therapistId, messageCount: validMessages.length });
        
        const result = await supabase.functions.invoke(
          'generate-ai-response',
          {
            body: {
              personId,
              personName: personData?.name || personName || 'Unknown',
              personRelationshipType: personData?.relationship_type || null,
              messages: validMessages,
              currentSubject,
              aiToneId: preferences.ai_tone_id,
              aiScienceMode: preferences.ai_science_mode,
              userId: authUser.id,
              therapistId,
            },
          }
        );
        
        console.log('[DEBUG] Edge function invoke result', { hasResult: !!result, hasData: !!result?.data, hasError: !!result?.error, resultKeys: result ? Object.keys(result) : [] });
        aiData = result?.data;
        aiError = result?.error;
      } catch (invokeException: any) {
        console.error('[ChatScreen] Exception invoking edge function:', invokeException);
        aiError = invokeException;
      }

      if (aiError) {
        console.error('[DEBUG] Edge function error:', aiError);
        console.error('[DEBUG] Error details:', {
          name: aiError?.name,
          message: aiError?.message,
          status: aiError?.status,
          context: aiError?.context,
          fullError: JSON.stringify(aiError, Object.getOwnPropertyNames(aiError)),
        });
        console.error('[ChatScreen] Edge function error:', aiError);
        console.error('[ChatScreen] Error details:', {
          name: aiError?.name,
          message: aiError?.message,
          status: aiError?.status,
          context: aiError?.context,
        });
        showErrorToast('Failed to generate response');
        return;
      }


      console.log('[DEBUG] Edge function success', { hasAiData: !!aiData, hasReply: !!aiData?.reply, aiDataKeys: aiData ? Object.keys(aiData) : [] });
      
      const aiReply = aiData?.reply;
      if (!aiReply || typeof aiReply !== 'string') {
        console.error('[DEBUG] No reply from AI', {
          hasData: !!aiData,
          dataType: typeof aiData,
          dataKeys: aiData ? Object.keys(aiData) : [],
          replyValue: aiData?.reply,
          replyType: typeof aiData?.reply,
          fullAiData: JSON.stringify(aiData).substring(0, 500),
        });
        console.error('[ChatScreen] No reply from AI', {
          hasData: !!aiData,
          dataType: typeof aiData,
          dataKeys: aiData ? Object.keys(aiData) : [],
          replyValue: aiData?.reply,
          replyType: typeof aiData?.reply,
        });
        showErrorToast('No response from AI');
        return;
      }

      console.log('[ChatScreen] AI reply received, length:', aiReply.length);

      // Insert AI message
      const { therapistName, therapistAvatar } = getCurrentTherapistMetadata();

      // Insert AI message (text only - type column has default 'text', safe to omit)
      const aiInsertPayload: any = {
        user_id: authUser.id,
        person_id: personId,
        sender: 'ai',
        content: aiReply,
        created_at: new Date().toISOString(),
      };
      // Only include subject if it exists (column may not exist in all databases)
      if (currentSubject) {
        aiInsertPayload.subject = currentSubject;
      }
      
      console.log('[DEBUG] AI insert payload:', JSON.stringify(aiInsertPayload, null, 2));
      const { data: aiMessage, error: aiInsertError } = await supabase
        .from('messages')
        .insert(aiInsertPayload)
        .select()
        .single();

      if (aiInsertError) {
        console.log('[DEBUG] AI insert error details:', {
          message: aiInsertError.message,
          code: aiInsertError.code,
          details: aiInsertError.details,
          hint: aiInsertError.hint,
          fullError: JSON.stringify(aiInsertError, Object.getOwnPropertyNames(aiInsertError)),
        });
        console.error('[ChatScreen] Error inserting AI message:', aiInsertError);
        showErrorToast('Failed to save AI response');
      } else if (aiMessage && isMountedRef.current) {
        // Immediately update local state to show the AI message (don't wait for realtime)
        setAllMessages((prev) => {
          // Check if message already exists (from realtime or previous insert)
          const exists = prev.some((m) => m.id === aiMessage.id);
          if (exists) {
            console.log('[DEBUG] AI message already in state, skipping duplicate');
            return prev;
          }
          // Use mergeMessages to ensure proper sorting
          const updated = mergeMessages(prev, [aiMessage as ExtendedMessage]);
          console.log('[DEBUG] Immediately updating allMessages after AI insert:', {
            prevCount: prev.length,
            newCount: updated.length,
            insertedMessageId: aiMessage.id,
          });
          return updated;
        });
      }
    } catch (error: any) {
      console.error('[ChatScreen] Error generating AI response:', error);
      showErrorToast('Failed to generate response');
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const renderMessage = ({ item }: ListRenderItemInfo<MessageListItem>) => {
    if ('type' in item && item.type === 'date_separator') {
      return <DateSeparator label={item.label} />;
    }

    const message = item as ExtendedMessage;
    // Handle both 'sender' (current) and 'role' (legacy) fields for backward compatibility
    const isUser = message.sender === 'user' || (message as any).role === 'user';

    // Render image message
    const messageType = (message as any).type;
    const imageUrl = (message as any).image_url;
    if (messageType === 'image' && imageUrl) {
      return (
        <View style={{ marginBottom: 12 }}>
          <ChatImageBubble imageUrl={imageUrl} />
        </View>
      );
    }

    // Render text message
    // Validate message content exists
    if (!message.content) {
      console.warn('[ChatScreen] Message missing content:', message.id);
      return null;
    }
    
    return (
      <ChatBubble
        message={message.content}
        isUser={isUser}
        timestamp={message.created_at}
        therapistName={message.therapist_name}
        therapistAvatarSource={message.therapist_avatar_source}
      />
    );
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  if (loading) {
    return <LoadingOverlay />;
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
          keyExtractor={(item, index) => ('id' in item && item.id ? item.id : `item-${index}`)}
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
