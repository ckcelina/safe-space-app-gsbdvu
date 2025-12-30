
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { AnimatedTypingIndicator } from '@/components/ui/AnimatedTypingIndicator';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { FullScreenSwipeHandler } from '@/components/ui/FullScreenSwipeHandler';
import { SwipeableModal } from '@/components/ui/SwipeableModal';
import { showErrorToast } from '@/utils/toast';
import { extractMemories } from '@/lib/memory/extractMemories';
import { getPersonMemories, upsertPersonMemories } from '@/lib/memory/personMemory';
import { upsertPersonContinuity, getPersonContinuity } from '@/lib/memory/personSummary';
import { extractMemoriesFromUserText } from '@/lib/memory/localExtract';
import { copyDebugToClipboard } from '@/lib/supabase/invokeEdge';
import { captureMemoriesFromMessage } from '@/lib/memoryCapture';
import { getPersonaById } from '@/constants/TherapistPersonas';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  logAIError,
} from '@/utils/aiErrorHandling';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { memoryCache } from '@/lib/cache/memoryCache';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default subjects list - IMPROVED LABELS
const DEFAULT_SUBJECTS = [
  'General',
  'Relationships',
  'Family',
  'Friends',
  'Work & Career',
  'Self-worth & Confidence',
  'Mental Health',
  'Studies & School',
  'Money & Life Admin',
];

// Extended Message type with therapist metadata and client-side status
interface ExtendedMessage extends Message {
  therapist_name?: string;
  therapist_avatar_source?: ImageSourcePropType;
  // Client-side only - not stored in DB
  failed_to_send?: boolean;
  retry_content?: string;
  // NEW: Optimistic flag for messages not yet persisted
  optimistic?: boolean;
  // NEW: Temporary ID for optimistic messages
  temp_id?: string;
}

// NEW: Message or Date Separator item type
type MessageListItem = 
  | { type: 'message'; data: ExtendedMessage; shouldAnimate: boolean }
  | { type: 'date-separator'; date: Date; label: string };

interface SubjectPillProps {
  subject: string;
  isSelected: boolean;
  onPress: (subject: string) => void;
  isAddButton?: boolean;
}

function SubjectPill({ subject, isSelected, onPress, isAddButton = false }: SubjectPillProps) {
  const { theme } = useThemeContext();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();
  };

  const handlePress = () => {
    onPress(subject);
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: isSelected ? theme.primary : theme.card,
            borderColor: isSelected ? theme.primary : theme.textSecondary + '40',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text
          style={[
            styles.pillText,
            {
              color: isSelected ? '#FFFFFF' : theme.textPrimary,
              fontWeight: isSelected ? '700' : '500',
            },
          ]}
        >
          {isAddButton ? '+ Add subject' : subject}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// NEW: Date Separator Component
function DateSeparator({ label }: { label: string }) {
  const { theme } = useThemeContext();
  
  return (
    <View style={styles.dateSeparatorContainer}>
      <View style={[styles.dateSeparatorPill, { backgroundColor: theme.card }]}>
        <Text style={[styles.dateSeparatorText, { color: theme.textSecondary }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

// NEW: Helper function to format date separator label
function getDateSeparatorLabel(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  // Format as "Dec 15, 2025"
  return format(date, 'MMM d, yyyy');
}

// NEW: Transform messages into list items with date separators
function transformMessagesWithSeparators(messages: ExtendedMessage[]): MessageListItem[] {
  const items: MessageListItem[] = [];
  let lastDate: Date | null = null;
  
  messages.forEach((message, index) => {
    const messageDate = new Date(message.created_at);
    
    // Check if we need to insert a date separator
    if (!lastDate || !isSameDay(lastDate, messageDate)) {
      items.push({
        type: 'date-separator',
        date: messageDate,
        label: getDateSeparatorLabel(messageDate),
      });
      lastDate = messageDate;
    }
    
    // Add the message
    // Animate only the most recent AI message (last in list)
    const shouldAnimate = message.role === 'assistant' && index === messages.length - 1;
    items.push({
      type: 'message',
      data: message,
      shouldAnimate,
    });
  });
  
  return items;
}

// NEW: Generate temporary ID for optimistic messages
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to merge messages with deduplication
function mergeMessages(existing: ExtendedMessage[], incoming: ExtendedMessage[]): ExtendedMessage[] {
  const merged = [...existing];
  
  for (const newMsg of incoming) {
    // Check if message already exists by ID
    const existsById = merged.some(m => m.id === newMsg.id);
    if (existsById) {
      continue; // Skip duplicate
    }

    // Check by temp_id for optimistic messages
    if (newMsg.temp_id) {
      const existsByTempId = merged.some(m => m.temp_id === newMsg.temp_id);
      if (existsByTempId) {
        continue; // Skip duplicate
      }
    }

    // Check by content hash (same role + content + subject + within 5 seconds)
    const newTime = new Date(newMsg.created_at).getTime();
    const isDuplicate = merged.some(m => {
      if (m.role !== newMsg.role) return false;
      if (m.subject !== newMsg.subject) return false;
      if (m.content !== newMsg.content) return false;
      
      const existingTime = new Date(m.created_at).getTime();
      const timeDiff = Math.abs(newTime - existingTime);
      return timeDiff < 5000; // Within 5 seconds
    });

    if (!isDuplicate) {
      merged.push(newMsg);
    }
  }

  // Sort by created_at
  return merged.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeA - timeB;
  });
}

// ACTIVITY TRACKING: Update person metadata
async function updatePersonActivity(
  userId: string,
  personId: string,
  activityType: 'opened' | 'message',
  timestamp?: string
): Promise<void> {
  if (!userId || !personId) {
    if (__DEV__) {
      console.warn('[Chat] updatePersonActivity: Missing userId or personId');
    }
    return;
  }

  try {
    const now = timestamp || new Date().toISOString();
    
    if (activityType === 'opened') {
      // Update both last_opened_at and last_activity_at when chat is opened
      const { error } = await supabase
        .from('persons')
        .update({
          last_opened_at: now,
          last_activity_at: now,
        })
        .eq('id', personId)
        .eq('user_id', userId);

      if (error) {
        if (__DEV__) {
          console.warn('[Chat] Failed to update last_opened_at:', error.message);
        }
      } else {
        console.log('[Chat] Updated last_opened_at and last_activity_at for person:', personId);
      }
    } else if (activityType === 'message') {
      // Update only last_activity_at when a message is sent/received
      const { error } = await supabase
        .from('persons')
        .update({
          last_activity_at: now,
        })
        .eq('id', personId)
        .eq('user_id', userId);

      if (error) {
        if (__DEV__) {
          console.warn('[Chat] Failed to update last_activity_at:', error.message);
        }
      } else {
        console.log('[Chat] Updated last_activity_at for person:', personId);
      }
    }
  } catch (err: any) {
    if (__DEV__) {
      console.warn('[Chat] updatePersonActivity error:', err?.message || 'unknown');
    }
  }
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    personId?: string | string[];
    personName?: string | string[];
    relationshipType?: string | string[];
    initialSubject?: string | string[];
  }>();

  const personId = Array.isArray(params.personId) ? params.personId[0] : params.personId || '';
  const personName = Array.isArray(params.personName) ? params.personName[0] : params.personName || 'Chat';
  const relationshipType = Array.isArray(params.relationshipType)
    ? params.relationshipType[0]
    : params.relationshipType || '';
  const initialSubject = Array.isArray(params.initialSubject) ? params.initialSubject[0] : params.initialSubject;

  // Check if this is a topic chat
  const isTopicChat = relationshipType === 'Topic';

  // Get safe area insets
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!personId) {
      if (__DEV__) {
        console.log('[Chat] Missing personId parameter - navigation may be broken');
      }
      showErrorToast('Invalid person ID');
    }
    if (!personName || personName === 'Chat') {
      if (__DEV__) {
        console.warn('[Chat] Missing personName parameter - using fallback');
      }
    }
  }, [personId, personName]);

  const { currentUser: authUser, role, isPremium } = useAuth();
  const { theme } = useThemeContext();
  const { preferences } = useUserPreferences();

  const [allMessages, setAllMessages] = useState<ExtendedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  // Track current subject in state
  const [currentSubject, setCurrentSubject] = useState<string>('General');

  // Subject pill state
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(DEFAULT_SUBJECTS);

  // Add race condition prevention refs and state
  const isGeneratingRef = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Add messagesRef to track current messages (avoid stale closures)
  const messagesRef = useRef<ExtendedMessage[]>([]);
  
  useEffect(() => {
    messagesRef.current = allMessages;
  }, [allMessages]);

  // CRITICAL: Track last processed user message ID to prevent loops
  const lastProcessedUserMessageIdRef = useRef<string | null>(null);

  // FlatList ref for scrolling
  const flatListRef = useRef<FlatList>(null);

  // REALTIME SAFETY NET: Channel ref for cleanup
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // IMPROVED: Scroll-to-bottom tracking with better reliability
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const scrollArrowOpacity = useRef(new Animated.Value(0)).current;
  
  // Track if we've done initial scroll and if content is ready
  const hasInitialScrolledRef = useRef(false);
  const contentSizeRef = useRef({ width: 0, height: 0 });
  const layoutSizeRef = useRef({ width: 0, height: 0 });

  // Dev-only debug state - ONLY stored in __DEV__ mode
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Track app state for detecting backgrounding
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Set initial subject from params if provided (from Library)
  useEffect(() => {
    if (initialSubject && initialSubject.trim()) {
      console.log('[Chat] Setting initial subject from params:', initialSubject);
      
      // Add to available subjects if not already present
      setAvailableSubjects((prev) => {
        if (!prev.includes(initialSubject)) {
          return [...prev, initialSubject];
        }
        return prev;
      });
      
      // Set as current subject
      setCurrentSubject(initialSubject);
    }
  }, [initialSubject]);

  // NEW: Simple modal state for adding subjects
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Track app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
      
      if (__DEV__) {
        console.log('[Chat] App state changed:', nextAppState);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isFreeUser = role === 'free';

  // Helper function to get current therapist metadata
  const getCurrentTherapistMetadata = useCallback(() => {
    const personaId = preferences.therapist_persona_id;
    if (!personaId) {
      return {
        name: 'Safe Space',
        avatarSource: undefined,
      };
    }

    const persona = getPersonaById(personaId);
    if (!persona) {
      return {
        name: 'Safe Space',
        avatarSource: undefined,
      };
    }

    return {
      name: persona.name,
      avatarSource: persona.image,
    };
  }, [preferences.therapist_persona_id]);

  // Safe backfill function - updates NULL/empty subjects to 'General'
  const backfillSubjects = useCallback(async () => {
    if (!personId || !authUser?.id) {
      return;
    }

    try {
      console.log('[Chat] Backfilling NULL/empty subjects to "General"...');
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ subject: 'General' })
        .eq('person_id', personId)
        .eq('user_id', authUser.id)
        .or('subject.is.null,subject.eq.');

      if (updateError) {
        if (__DEV__) {
          console.log('[Chat] Backfill error:', updateError);
        }
      } else {
        if (__DEV__) {
          console.log('[Chat] Backfill completed successfully');
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.log('[Chat] Backfill unexpected error:', err);
      }
    }
  }, [personId, authUser?.id]);

  const loadMessages = useCallback(async () => {
    if (!personId) {
      console.warn('[Chat] loadMessages: personId is missing');
      if (isMountedRef.current) {
        setLoading(false);
        setError('Invalid person ID');
      }
      return;
    }

    if (!authUser?.id) {
      console.warn('[Chat] loadMessages: No user ID available');
      if (isMountedRef.current) {
        setLoading(false);
        setError('You must be logged in to view messages');
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[Chat] Loading messages for person:', personId, 'user:', authUser.id);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('person_id', personId)
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true });

      if (error) {
        if (__DEV__) {
          console.log('[Chat] loadMessages error', error);
        }
        if (isMountedRef.current) {
          setError('Failed to load messages');
        }
        return;
      }

      console.log('[Chat] Messages loaded:', data?.length || 0);
      
      // Attach current therapist metadata to existing AI messages
      // This is a fallback for old messages that don't have metadata stored
      const therapistMeta = getCurrentTherapistMetadata();
      const messagesWithMetadata: ExtendedMessage[] = (data ?? []).map((msg) => {
        if (msg.role === 'assistant') {
          return {
            ...msg,
            therapist_name: therapistMeta.name,
            therapist_avatar_source: therapistMeta.avatarSource,
          };
        }
        return msg;
      });
      
      if (isMountedRef.current) {
        setAllMessages(messagesWithMetadata);
      }

      backfillSubjects();
    } catch (err: any) {
      if (__DEV__) {
        console.log('[Chat] loadMessages unexpected error:', err);
      }
      if (isMountedRef.current) {
        setError('An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [personId, authUser?.id, backfillSubjects, getCurrentTherapistMetadata]);

  useEffect(() => {
    if (personId && authUser?.id) {
      loadMessages();
    } else {
      setLoading(false);
      if (!personId) {
        setError('Invalid person ID');
      } else if (!authUser?.id) {
        setError('You must be logged in');
      }
    }
  }, [personId, authUser?.id, loadMessages]);

  // ACTIVITY TRACKING: Update last_opened_at when chat screen mounts
  useEffect(() => {
    if (personId && authUser?.id) {
      console.log('[Chat] Chat screen mounted - updating last_opened_at');
      updatePersonActivity(authUser.id, personId, 'opened');
    }
  }, [personId, authUser?.id]);

  // REALTIME SAFETY NET: Subscribe to assistant message inserts
  useEffect(() => {
    // Only subscribe if we have valid user and person IDs
    if (!authUser?.id || !personId) {
      console.log('[Realtime] Skipping subscription - missing user or person ID');
      return;
    }

    // Check if already subscribed
    if (realtimeChannelRef.current?.state === 'subscribed') {
      console.log('[Realtime] Already subscribed, skipping');
      return;
    }

    console.log('[Realtime] Setting up subscription for assistant messages');
    console.log('[Realtime] Filters:', {
      user_id: authUser.id,
      person_id: personId,
      role: 'assistant',
    });

    // Create channel with dedicated topic for this chat
    const channel = supabase.channel(`chat:${personId}:assistant-messages`, {
      config: {
        broadcast: { self: false, ack: false },
        private: false, // Using postgres_changes, not broadcast
      },
    });

    realtimeChannelRef.current = channel;

    // Subscribe to INSERT events for assistant messages
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${authUser.id},person_id=eq.${personId},role=eq.assistant`,
        },
        (payload) => {
          console.log('[Realtime] Received assistant message INSERT:', payload);

          if (!payload.new) {
            console.warn('[Realtime] No payload.new data');
            return;
          }

          const newMessage = payload.new as Message;

          // Attach therapist metadata
          const therapistMeta = getCurrentTherapistMetadata();
          const messageWithMetadata: ExtendedMessage = {
            ...newMessage,
            therapist_name: therapistMeta.name,
            therapist_avatar_source: therapistMeta.avatarSource,
          };

          console.log('[Realtime] Merging assistant message into state:', newMessage.id);

          // Merge into state using existing mergeMessages function
          if (isMountedRef.current) {
            setAllMessages((prev) => mergeMessages(prev, [messageWithMetadata]));

            // If we're currently generating, stop the typing indicator
            if (isGeneratingRef.current || isGenerating) {
              console.log('[Realtime] Stopping typing indicator');
              isGeneratingRef.current = false;
              setIsGenerating(false);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Subscription status:', status);
        if (err) {
          console.error('[Realtime] Subscription error:', err);
        }
      });

    // Cleanup on unmount
    return () => {
      console.log('[Realtime] Cleaning up subscription');
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [authUser?.id, personId, getCurrentTherapistMetadata, isGenerating]);

  // Filter messages for display based on current subject
  const displayedMessages = React.useMemo(() => {
    return allMessages.filter((msg) => {
      const msgSubject = msg.subject || 'General';
      return msgSubject === currentSubject;
    });
  }, [allMessages, currentSubject]);

  // NEW: Transform messages with date separators
  const messageListItems = React.useMemo(() => {
    return transformMessagesWithSeparators(displayedMessages);
  }, [displayedMessages]);

  // IMPROVED: Reliable scroll-to-bottom implementation
  
  // Scroll to bottom helper - used by multiple triggers
  const scrollToBottom = useCallback((animated: boolean = true) => {
    if (flatListRef.current && messageListItems.length > 0) {
      flatListRef.current.scrollToEnd({ animated });
    }
  }, [messageListItems.length]);

  // Handle initial scroll when messages first load
  useEffect(() => {
    if (!loading && messageListItems.length > 0 && !hasInitialScrolledRef.current) {
      // Wait for layout to complete before scrolling
      setTimeout(() => {
        scrollToBottom(false); // No animation for initial scroll
        hasInitialScrolledRef.current = true;
      }, 150);
    }
  }, [loading, messageListItems.length, scrollToBottom]);

  // Handle onContentSizeChange - most reliable trigger for new messages
  const handleContentSizeChange = useCallback((width: number, height: number) => {
    contentSizeRef.current = { width, height };
    
    // Only auto-scroll if:
    // 1. User is already near bottom (within 50px)
    // 2. OR this is the initial load (hasn't scrolled yet)
    if (isNearBottom || !hasInitialScrolledRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [isNearBottom, scrollToBottom]);

  // Handle onLayout - track layout size
  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    layoutSizeRef.current = { width, height };
  }, []);

  // Handle scroll events to track position
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    
    // Calculate if we're near the bottom (within 50px tolerance)
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const nearBottom = distanceFromBottom < 50;
    
    setIsNearBottom(nearBottom);
    
    // Show/hide arrow based on position
    // Only show if:
    // 1. Not at bottom
    // 2. Content is scrollable (contentSize > layoutMeasurement)
    // 3. Has scrolled at least once (not initial load)
    const shouldShowArrow = !nearBottom && contentSize.height > layoutMeasurement.height && hasInitialScrolledRef.current;
    
    if (shouldShowArrow !== showScrollArrow) {
      setShowScrollArrow(shouldShowArrow);
      
      // Animate arrow appearance/disappearance
      Animated.timing(scrollArrowOpacity, {
        toValue: shouldShowArrow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showScrollArrow, scrollArrowOpacity]);

  const handleRetry = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  const areSimilar = useCallback((str1: string, str2: string): boolean => {
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,!?;:]/g, '');
    const norm1 = normalize(str1);
    const norm2 = normalize(str2);

    const prefix1 = norm1.substring(0, 20);
    const prefix2 = norm2.substring(0, 20);
    
    if (prefix1 === prefix2 && prefix1.length > 10) {
      return true;
    }

    if (norm1.length < 50 && norm2.length < 50) {
      if (norm1.includes(norm2) || norm2.includes(norm1)) {
        return true;
      }
    }

    return false;
  }, []);

  // NEW: Retry handler for failed messages
  const retryFailedMessage = useCallback(async (messageId: string, retryContent: string) => {
    if (!authUser?.id || !personId) {
      return;
    }

    console.log('[Chat] Retrying failed message:', messageId);

    // Remove the failed message from UI
    setAllMessages((prev) => prev.filter((msg) => msg.id !== messageId));

    // Set the input text to the retry content and trigger send
    setInputText(retryContent);
    
    // Small delay to ensure state updates
    setTimeout(() => {
      sendMessage();
    }, 100);
  }, [authUser?.id, personId]);

  // MAIN SEND MESSAGE FUNCTION - WITH SESSION VALIDATION
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();

    // Race condition guard - check BOTH ref and state
    if (isGeneratingRef.current || isGenerating) {
      console.log('[Chat] sendMessage: Already generating, ignoring duplicate call');
      return;
    }

    if (!text || !personId) {
      console.log('[Chat] sendMessage: validation failed', {
        hasText: !!text,
        personId,
      });
      return;
    }

    const userId = authUser?.id;
    if (!userId) {
      console.warn('[Chat] sendMessage: No userId available');
      showErrorToast('You must be logged in to send messages');
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // NEW: VALIDATE SESSION BEFORE EDGE FUNCTION CALL
    // ═══════════════════════════════════════════════════════════════════
    console.log('[Chat] Validating session before Edge Function call...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[Chat] Session validation error:', sessionError);
      showErrorToast('Session error. Please try logging in again.');
      return;
    }

    if (!session) {
      console.error('[Chat] No valid session - user needs to re-authenticate');
      showErrorToast('Your session has expired. Please log in again.');
      router.replace('/login');
      return;
    }

    console.log('[Chat] Session validated successfully');

    console.log('[Chat] sendMessage: Starting send process');
    console.log('[Chat] Current subject:', currentSubject);
    console.log('[Chat] chatId (personId):', personId);
    
    // Get current therapist metadata for this message
    const therapistMeta = getCurrentTherapistMetadata();
    console.log('[Chat] Current therapist:', therapistMeta.name);
    
    // Set in-flight flags IMMEDIATELY
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setIsSending(true);
    setError(null);
    
    // PRODUCTION SAFETY: Clear debug info in production builds
    if (__DEV__) {
      setDebugInfo(null);
    }
    
    // Clear input immediately to prevent re-sends
    const userMessageText = text;
    setInputText('');

    try {
      // Build user message with canonical fields
      const userMsg: ExtendedMessage = {
        id: generateTempId(), // Temporary ID for optimistic UI
        temp_id: generateTempId(),
        user_id: userId,
        person_id: personId,
        role: 'user',
        content: userMessageText,
        subject: currentSubject,
        created_at: new Date().toISOString(),
        optimistic: true,
      };

      // Optimistically append user message to state IMMEDIATELY
      if (isMountedRef.current) {
        setAllMessages((prev) => mergeMessages(prev, [userMsg]));
      }

      // Build payload using LOCAL array that includes userMsg
      const nextMessages = [...messagesRef.current, userMsg];

      console.log('[Chat] User message added optimistically');
      console.log('[Chat] Total messages in nextMessages:', nextMessages.length);

      // Now persist the user message to Supabase
      console.log('[Chat] Inserting user message to Supabase...');
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          person_id: personId,
          role: 'user',
          content: userMessageText,
          subject: currentSubject,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (insertError || !insertedMessage) {
        if (__DEV__) {
          console.log('[Chat] Insert user message error:', insertError);
        }
        if (isMountedRef.current) {
          setInputText(userMessageText); // Restore input on error
          setError(insertError?.message || 'Failed to send message. Please try again.');
        }
        return; // Early return, finally block will reset flags
      }

      console.log('[Chat] User message inserted:', insertedMessage.id);
      
      lastProcessedUserMessageIdRef.current = insertedMessage.id;

      // Replace optimistic user message with persisted one
      if (isMountedRef.current) {
        setAllMessages((prev) => {
          return prev.map(m => {
            if (m.temp_id === userMsg.temp_id) {
              return insertedMessage;
            }
            return m;
          });
        });
      }

      // ACTIVITY TRACKING: Update last_activity_at after user message sent
      console.log('[Chat] Updating last_activity_at after user message');
      await updatePersonActivity(userId, personId, 'message', insertedMessage.created_at);
      
      // Update cache with new activity timestamp
      memoryCache.setLastActivity(personId, insertedMessage.created_at);

      // MEMORY CAPTURE: Fire-and-forget capture of factual statements
      console.log('[Chat] 🧠 Triggering memory capture...');
      
      // Check continuity setting first
      getPersonContinuity(userId, personId).then((continuityData) => {
        const continuityEnabled = continuityData.continuity_enabled;
        
        console.log('[Chat] Memory capture - continuity enabled:', continuityEnabled);
        
        if (continuityEnabled) {
          console.log('[Chat] Memory capture - calling captureMemoriesFromMessage');
          // Call the memory capture function (fire-and-forget)
          captureMemoriesFromMessage(
            userId,
            personId,
            userMessageText,
            personName,
            currentSubject
          ).catch((err) => {
            // Silent failure - never crash the chat
            if (__DEV__) {
              console.log('[Chat] Memory capture failed (silent):', err?.message || 'unknown');
            }
          });
        } else {
          console.log('[Chat] Memory capture - skipped (continuity disabled)');
        }
      }).catch((err) => {
        // If we can't check continuity, default to enabled
        if (__DEV__) {
          console.log('[Chat] Failed to check continuity, defaulting to enabled:', err);
        }
        captureMemoriesFromMessage(
          userId,
          personId,
          userMessageText,
          personName,
          currentSubject
        ).catch(() => {
          // Silent failure
        });
      });

      // LOCAL MEMORY EXTRACTION: Extract memories from user text immediately
      // NOTE: Memory saving logic continues silently - NO UI feedback
      try {
        console.log('[Chat] Running local memory extraction...');
        const extractedMemories = extractMemoriesFromUserText(userMessageText, personName);
        
        if (extractedMemories.length > 0) {
          console.log('[Chat] Extracted', extractedMemories.length, 'memories locally');
          await upsertPersonMemories(userId, personId, extractedMemories);
          console.log('[Chat] Local memories upserted successfully');
        } else {
          console.log('[Chat] No memories extracted from user text');
        }
      } catch (memoryError: any) {
        // Silent failure - never crash the chat
        console.log('[Chat] Local memory extraction failed (silent):', memoryError?.message || 'unknown');
      }

      // AI GENERATION WITH DIRECT EDGE FUNCTION INVOCATION
      
      // Filter messages for current subject and prepare for AI
      const subjectMessages = nextMessages.filter((msg) => {
        const msgSubject = msg.subject || 'General';
        return msgSubject === currentSubject;
      });
      
      const recentMessages = subjectMessages
        .slice(-20)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.created_at,
        }));

      const lastAssistantMessage = subjectMessages
        .filter((m) => m.role === 'assistant')
        .slice(-1)[0];

      // Prepare AI request payload
      const aiPayload = {
        userId,
        personId,
        personName,
        personRelationshipType: relationshipType || 'Unknown',
        messages: recentMessages,
        currentSubject: currentSubject,
        aiToneId: preferences.ai_tone_id,
        aiScienceMode: preferences.ai_science_mode,
      };

      // DEV-ONLY PAYLOAD LOGGING (CRITICAL FOR DEBUGGING)
      if (__DEV__) {
        const lastMessage = aiPayload.messages[aiPayload.messages.length - 1];
        console.log('[AI_PAYLOAD]', {
          messageCount: aiPayload.messages.length,
          lastRole: lastMessage?.role || 'none',
          hasPersonId: !!aiPayload.personId,
          hasUserId: !!aiPayload.userId,
          hasPersonName: !!aiPayload.personName,
          hasRelationshipType: !!aiPayload.personRelationshipType,
          hasCurrentSubject: !!aiPayload.currentSubject,
          hasAiToneId: !!aiPayload.aiToneId,
          aiScienceMode: aiPayload.aiScienceMode,
        });
      }

      console.log('[Chat] Sending to AI:', {
        chatId: personId,
        messageCount: recentMessages.length,
        lastUserMessageId: insertedMessage.id,
        subject: currentSubject,
        aiToneId: preferences.ai_tone_id,
        aiScienceMode: preferences.ai_science_mode,
      });

      // DIRECT EDGE FUNCTION INVOCATION (NO WRAPPER)
      const { data, error } = await supabase.functions.invoke('generate-ai-response', { 
        body: aiPayload 
      });

      // DEV-only: Log raw edge function response for diagnosis
      if (__DEV__) {
        console.log('[AI_EDGE_RAW]', {
          hasData: !!data,
          hasError: !!error,
          dataKeys: data ? Object.keys(data) : null,
          error: error ? {
            name: (error as any)?.name,
            message: (error as any)?.message,
            status: (error as any)?.status,
          } : null,
        });
      }

      // ERROR HANDLING
      if (error) {
        const errorMessage = (error as any)?.message || 'Edge invoke error';
        console.error('[Chat] Edge function error:', errorMessage);
        
        // Log error for debugging
        if (__DEV__) {
          logAIError('AI_REQUEST', error, {
            conversationId: personId,
            userId,
            messageCount: recentMessages.length,
            attempt: 1,
          });
        }

        // Build debug info for DEV mode
        if (__DEV__) {
          const debugString = JSON.stringify({
            functionName: 'generate-ai-response',
            timestamp: new Date().toISOString(),
            lastUserMessageId: insertedMessage.id,
            error,
          }, null, 2);

          setDebugInfo(debugString);
        }

        // Create error bubble
        const tempId = generateTempId();
        const errorBubble: ExtendedMessage = {
          id: tempId,
          temp_id: tempId,
          user_id: userId,
          person_id: personId,
          role: 'assistant',
          content: "I'm having trouble responding right now. Please try again.",
          subject: currentSubject,
          created_at: new Date().toISOString(),
          therapist_name: therapistMeta.name,
          therapist_avatar_source: therapistMeta.avatarSource,
          optimistic: true,
          failed_to_send: true,
          retry_content: userMessageText,
        };

        if (isMountedRef.current) {
          setAllMessages((prev) => mergeMessages(prev, [errorBubble]));
          setError(errorMessage);
        }

        return; // Exit - error handled
      }

      // SUCCESS: Edge Function will insert assistant message
      // Realtime subscription will handle UI update
      console.log('[Chat] Edge Function invoked successfully');
      console.log('[Chat] Waiting for realtime subscription to deliver assistant message...');

      // The Edge Function now returns { ok: true, data: { replyText, assistantMessage } }
      // But we don't need to manually add it to state - the realtime subscription will handle it
      const assistantMessage = data?.data?.assistantMessage;
      
      if (!assistantMessage || !assistantMessage.id) {
        console.warn('[Chat] Edge Function did not return assistantMessage in response');
        console.log('[Chat] This is OK - realtime subscription will deliver it');
      } else {
        console.log('[Chat] Edge Function returned assistant message:', assistantMessage.id);
        console.log('[Chat] Realtime subscription should also deliver this message');
      }

      // ACTIVITY TRACKING: Update last_activity_at after assistant message saved
      if (assistantMessage?.created_at) {
        console.log('[Chat] Updating last_activity_at after assistant message');
        await updatePersonActivity(userId, personId, 'message', assistantMessage.created_at);
        
        // Update cache with new activity timestamp
        memoryCache.setLastActivity(personId, assistantMessage.created_at);
      }

      console.log('[Chat] sendMessage: Complete');

      // MEMORY EXTRACTION + CONTINUITY UPDATE: Extract memories and update continuity in the background
      // NOTE: Memory saving logic continues silently - NO UI feedback
      if (assistantMessage?.content) {
        (async () => {
          try {
            console.log('[Chat] Triggering memory extraction and continuity update...');
            
            // Get existing memories for context
            const existingMemories = await getPersonMemories(userId, personId, 50);
            
            // Extract last 5 user messages for context
            const userMessages = subjectMessages
              .filter(m => m.role === 'user')
              .slice(-5)
              .map(m => m.content);

            // Extract memories and continuity
            const extractionResult = await extractMemories({
              personName,
              recentUserMessages: userMessages,
              lastAssistantMessage: assistantMessage.content,
              existingMemories: existingMemories.map(m => ({
                key: m.key,
                value: m.value,
                category: m.category,
              })),
              userId,
              personId,
            });
            
            console.log('[Chat] Memory extraction complete');
            
            // Update continuity if we got valid data
            if (extractionResult.continuity) {
              console.log('[Chat] Updating conversation continuity...');
              await upsertPersonContinuity(userId, personId, extractionResult.continuity);
              console.log('[Chat] Continuity updated successfully');
            }
          } catch (memoryError) {
            // Silently fail - memory extraction should never break chat
            if (__DEV__) {
              console.log('[Chat] Memory extraction/continuity update failed (silent):', memoryError);
            }
          }
        })();
      }
    } catch (err: any) {
      // Unexpected error in sendMessage
      if (__DEV__) {
        console.log('[Chat] sendMessage unexpected error:', err);
        logAIError('AI_REQUEST', err, {
          conversationId: personId,
          userId,
        });
      }
      
      if (isMountedRef.current) {
        setInputText(userMessageText); // Restore input on error
        setError(err?.message || 'An unexpected error occurred');
      }
    } finally {
      // CRITICAL: Always reset flags in finally block
      if (isMountedRef.current) {
        isGeneratingRef.current = false;
        setIsGenerating(false);
        setIsSending(false);
      }
      
      console.log('[Chat] Flags reset - isGenerating:', false, 'isSending:', false);
    }
  }, [
    authUser?.id,
    inputText,
    isGenerating,
    personId,
    personName,
    relationshipType,
    currentSubject,
    areSimilar,
    preferences.ai_science_mode,
    preferences.ai_tone_id,
    getCurrentTherapistMetadata,
  ]);

  // Disable send button while generating
  const isSendDisabled = !inputText.trim() || isSending || loading || isGenerating;

  const handleBackPress = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/(home)');
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[Chat] Back navigation error:', error);
      }
      router.replace('/(tabs)/(home)');
    }
  }, []);

  const handleSubjectPress = useCallback((subject: string) => {
    console.log('[Chat] Subject selected:', subject);
    setCurrentSubject(subject);
  }, []);

  // NEW: Open simple add subject modal
  const openAddSubjectModal = useCallback(() => {
    console.log('[Chat] Opening Add Subject modal');
    setShowAddSubjectModal(true);
    setNewSubjectName('');
  }, []);

  // NEW: Close simple add subject modal
  const closeAddSubjectModal = useCallback(() => {
    console.log('[Chat] Closing Add Subject modal');
    setShowAddSubjectModal(false);
    setNewSubjectName('');
  }, []);

  // NEW: Add subject handler
  const addSubject = useCallback(() => {
    const trimmedSubject = newSubjectName.trim();
    
    if (!trimmedSubject) {
      console.log('[Chat] No subject to add');
      return;
    }

    // Check for duplicates (case-insensitive)
    const lowercasedSubject = trimmedSubject.toLowerCase();
    const isDuplicate = availableSubjects.some(
      (s) => s.toLowerCase() === lowercasedSubject
    );

    if (isDuplicate) {
      console.log('[Chat] Subject already exists:', trimmedSubject);
      showErrorToast('This subject already exists');
      return;
    }

    console.log('[Chat] Adding new subject:', trimmedSubject);

    // Add to available subjects
    setAvailableSubjects((prev) => [...prev, trimmedSubject]);

    // Auto-select the new subject
    setCurrentSubject(trimmedSubject);

    // Close modal
    closeAddSubjectModal();
  }, [newSubjectName, availableSubjects, closeAddSubjectModal]);

  // Handle debug banner tap (copy to clipboard) - ONLY in __DEV__
  const handleDebugBannerTap = useCallback(async () => {
    if (__DEV__ && debugInfo) {
      await copyDebugToClipboard(debugInfo);
      showErrorToast('Debug info copied to clipboard');
    }
  }, [debugInfo]);

  // Handle error banner tap for retry
  const handleErrorBannerTap = useCallback(() => {
    // For abort/timeout errors, just dismiss
    if (error && error.includes('Connection interrupted')) {
      setError(null);
      return;
    }
    
    // Find the most recent failed message
    const failedMessage = allMessages
      .filter((msg) => msg.failed_to_send && msg.retry_content)
      .slice(-1)[0];
    
    if (failedMessage && failedMessage.retry_content) {
      retryFailedMessage(failedMessage.id, failedMessage.retry_content);
      setError(null);
    } else {
      // No failed message to retry, just dismiss error
      setError(null);
    }
  }, [allMessages, retryFailedMessage, error]);

  // Render individual list item (message or date separator)
  const renderListItem = useCallback(({ item }: ListRenderItemInfo<MessageListItem>) => {
    if (item.type === 'date-separator') {
      return <DateSeparator label={item.label} />;
    }
    
    // Message item
    const message = item.data;
    const isFailed = message.failed_to_send === true;
    
    return (
      <View>
        <AnimatedChatBubble
          message={message.content}
          isUser={message.role === 'user'}
          timestamp={message.created_at}
          animate={item.shouldAnimate}
          therapistName={message.therapist_name}
          therapistAvatarSource={message.therapist_avatar_source}
          therapistPersonaId={preferences.therapist_persona_id}
        />
        {isFailed && message.retry_content && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => retryFailedMessage(message.id, message.retry_content!)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="arrow.clockwise"
              android_material_icon_name="refresh"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [preferences.therapist_persona_id, theme.primary, retryFailedMessage]);

  // Key extractor using message.id (string)
  const keyExtractor = useCallback((item: MessageListItem, index: number) => {
    if (item.type === 'date-separator') {
      return `date-${item.date.toISOString()}-${index}`;
    }
    // Use temp_id for optimistic messages, otherwise use id
    return item.data.temp_id || item.data.id;
  }, []);

  // Empty list component
  const renderEmptyList = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyChat}>
        <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
          <IconSymbol
            ios_icon_name="bubble.left.and.bubble.right.fill"
            android_material_icon_name="chat"
            size={40}
            color={theme.primary}
          />
        </View>
        <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
          Start the conversation
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          Share your thoughts and feelings about {personName}
        </Text>
        {currentSubject !== 'General' && allMessages.length > 0 && (
          <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
            No messages for &quot;{currentSubject}&quot; yet. Switch to &quot;General&quot; to see other messages.
          </Text>
        )}
        {error && (
          <TouchableOpacity style={{ marginTop: 12 }} onPress={handleRetry} activeOpacity={0.7}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>
              Try loading messages again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [loading, theme, personName, currentSubject, allMessages.length, error, handleRetry]);

  // Footer component (typing indicator at bottom of non-inverted list)
  const renderListFooter = useCallback(() => {
    if (!isGenerating) return null;
    
    const therapistMeta = getCurrentTherapistMetadata();
    
    return (
      <AnimatedTypingIndicator 
        therapistAvatarSource={therapistMeta.avatarSource}
        therapistPersonaId={preferences.therapist_persona_id}
        therapistName={therapistMeta.name}
      />
    );
  }, [isGenerating, getCurrentTherapistMetadata, preferences.therapist_persona_id]);

  return (
    <FullScreenSwipeHandler enabled={!isGenerating && !isSending}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Status Bar Gradient - matches theme gradient */}
          <LinearGradient
            colors={theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.statusBarGradient, { height: insets.top }]}
            pointerEvents="none"
          />

          {/* Header with Gradient Background */}
          <LinearGradient
            colors={theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.headerGradient, { paddingTop: insets.top }]}
          >
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={handleBackPress} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow_back"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {personName}
                  </Text>
                  {isPremium && !isTopicChat && (
                    <View style={styles.premiumBadgeSmall}>
                      <Text style={styles.premiumBadgeSmallText}>⭐</Text>
                    </View>
                  )}
                </View>
                {relationshipType && (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {relationshipType}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/(tabs)/(home)/memories',
                  params: { personId, personName }
                })} 
                style={styles.memoriesButton}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="brain"
                  android_material_icon_name="psychology"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Subject Pills Row */}
          <View style={[styles.pillsContainer, { backgroundColor: theme.card }]}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsScrollContent}
              keyboardShouldPersistTaps="handled"
              data={[...availableSubjects, '+ Add subject']}
              renderItem={({ item, index }) => (
                <SubjectPill
                  key={`subject-${index}-${item}`}
                  subject={item}
                  isSelected={currentSubject === item}
                  onPress={item === '+ Add subject' ? openAddSubjectModal : handleSubjectPress}
                  isAddButton={item === '+ Add subject'}
                />
              )}
              keyExtractor={(item, index) => `subject-${index}-${item}`}
            />
          </View>

          {/* DEVELOPER DEBUG BANNER */}
          {__DEV__ && debugInfo && (
            <TouchableOpacity 
              style={[styles.debugBanner, { backgroundColor: '#FF9500' }]}
              onPress={handleDebugBannerTap}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={16}
                color="#FFFFFF"
                style={styles.bannerIcon}
              />
              <Text style={[styles.debugBannerText, { color: '#FFFFFF' }]}>
                AI error (tap to copy debug)
              </Text>
            </TouchableOpacity>
          )}

          {error && (
            <TouchableOpacity 
              style={[styles.errorBanner, { backgroundColor: '#FF3B30' }]}
              onPress={handleErrorBannerTap}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={16}
                color="#FFFFFF"
                style={styles.bannerIcon}
              />
              <Text style={[styles.errorBannerText, { color: '#FFFFFF' }]}>
                {error}
              </Text>
              <TouchableOpacity onPress={() => setError(null)} style={styles.dismissButton} activeOpacity={0.7}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={16}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          <FlatList
            ref={flatListRef}
            data={messageListItems}
            renderItem={renderListItem}
            keyExtractor={keyExtractor}
            inverted={false}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyList}
            ListFooterComponent={renderListFooter}
            removeClippedSubviews={Platform.OS === 'android'}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleLayout}
            extraData={messageListItems}
          />

          {/* Floating Scroll-to-Bottom Arrow */}
          {showScrollArrow && (
            <Animated.View
              style={[
                styles.scrollArrowContainer,
                {
                  opacity: scrollArrowOpacity,
                  bottom: insets.bottom + 80,
                },
              ]}
              pointerEvents={showScrollArrow ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={[
                  styles.scrollArrowButton,
                  {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                  },
                ]}
                onPress={() => scrollToBottom(true)}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="chevron.down"
                  android_material_icon_name="keyboard_arrow_down"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Input Container */}
          <View style={[
            styles.inputContainer, 
            { 
              backgroundColor: theme.card,
              paddingBottom: insets.bottom || 8,
            }
          ]}>
            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <View style={[
                  styles.inputWrapper, 
                  { 
                    backgroundColor: theme.background,
                    borderWidth: inputFocused ? 2 : 1,
                    borderColor: inputFocused ? theme.primary : theme.textSecondary + '40',
                  }
                ]}>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="Tell me what's going on…"
                    placeholderTextColor={theme.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    multiline
                    editable={!isSending && !loading && !isGenerating}
                    onSubmitEditing={() => {
                      if (!isSendDisabled && !isGenerating) {
                        sendMessage();
                      }
                    }}
                    cursorColor={theme.primary}
                    selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: theme.primary },
                  isSendDisabled && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={isSendDisabled}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="paperplane.fill"
                  android_material_icon_name="send"
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading && !error} />

      {/* NEW: Simple Add Subject Modal */}
      <Modal
        visible={showAddSubjectModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeAddSubjectModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeAddSubjectModal}
          >
            <TouchableOpacity
              style={[styles.simpleModalContent, { backgroundColor: theme.card }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.simpleModalTitle, { color: theme.textPrimary }]}>
                Add subject
              </Text>

              <TextInput
                style={[
                  styles.simpleModalInput,
                  {
                    backgroundColor: theme.background,
                    color: theme.textPrimary,
                    borderColor: theme.textSecondary + '40',
                  },
                ]}
                placeholder="e.g., Friendships"
                placeholderTextColor={theme.textSecondary}
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                autoFocus={true}
                autoCapitalize="words"
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={addSubject}
                cursorColor={theme.primary}
                selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
              />

              <View style={styles.simpleModalButtons}>
                <TouchableOpacity
                  style={[styles.simpleModalButton, { backgroundColor: theme.background }]}
                  onPress={closeAddSubjectModal}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.simpleModalButtonText, { color: theme.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.simpleModalButton,
                    { backgroundColor: theme.primary },
                    !newSubjectName.trim() && styles.simpleModalButtonDisabled,
                  ]}
                  onPress={addSubject}
                  disabled={!newSubjectName.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.simpleModalButtonText, { color: '#FFFFFF' }]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </FullScreenSwipeHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  memoriesButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  headerTitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.06, 24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  premiumBadgeSmall: {
    marginLeft: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeSmallText: {
    fontSize: 12,
  },
  headerSubtitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.035, 14),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  pillsContainer: {
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pillsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillText: {
    fontSize: 14,
  },
  debugBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  debugBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: '5%',
    paddingVertical: 16,
  },
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: '10%',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: Math.min(SCREEN_WIDTH * 0.06, 24),
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: Math.min(SCREEN_WIDTH * 0.035, 14),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    fontStyle: 'italic',
  },
  scrollArrowContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  scrollArrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    paddingHorizontal: '5%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputColumn: {
    flex: 1,
  },
  inputWrapper: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    lineHeight: 20,
    minHeight: 24,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    marginRight: '5%',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  simpleModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  simpleModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  simpleModalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  simpleModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  simpleModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleModalButtonDisabled: {
    opacity: 0.4,
  },
  simpleModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
