
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
  Keyboard,
  InteractionManager,
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
import { MemorySavedIndicator } from '@/components/ui/MemorySavedIndicator';
import { showErrorToast } from '@/utils/toast';
import { extractMemories } from '@/lib/memory/extractMemories';
import { getPersonMemories, upsertPersonMemories } from '@/lib/memory/personMemory';
import { upsertPersonContinuity, getPersonContinuity } from '@/lib/memory/personSummary';
import { extractMemoriesFromUserText } from '@/lib/memory/localExtract';
import { invokeEdgeSafe, copyDebugToClipboard } from '@/lib/supabase/invokeEdge';
import { captureMemoriesFromMessage } from '@/lib/memoryCapture';
import { getPersonaById } from '@/constants/TherapistPersonas';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Typing indicator timeout (15 seconds as per requirements)
const TYPING_TIMEOUT_MS = 15000;

// Input height buffer for proper padding
const INPUT_HEIGHT_BUFFER = 100;

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

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE: Memoized SubjectPill component
// ═══════════════════════════════════════════════════════════════════
const SubjectPill = React.memo(({ subject, isSelected, onPress, isAddButton = false }: SubjectPillProps) => {
  const { theme } = useThemeContext();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    onPress(subject);
  }, [onPress, subject]);

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
});

SubjectPill.displayName = 'SubjectPill';

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE: Memoized DateSeparator component
// ═══════════════════════════════════════════════════════════════════
const DateSeparator = React.memo(({ label }: { label: string }) => {
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
});

DateSeparator.displayName = 'DateSeparator';

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

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE: Isolated ChatHeader component
// ═══════════════════════════════════════════════════════════════════
interface ChatHeaderProps {
  personName: string;
  relationshipType?: string;
  isPremium: boolean;
  isTopicChat: boolean;
  personId: string;
  onBackPress: () => void;
}

const ChatHeader = React.memo(({ 
  personName, 
  relationshipType, 
  isPremium, 
  isTopicChat, 
  personId,
  onBackPress 
}: ChatHeaderProps) => {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();

  const handleMemoriesPress = useCallback(() => {
    router.push({
      pathname: '/(tabs)/(home)/memories',
      params: { personId, personName }
    });
  }, [personId, personName]);

  return (
    <>
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
            onPress={onBackPress} 
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
            onPress={handleMemoriesPress} 
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
    </>
  );
});

ChatHeader.displayName = 'ChatHeader';

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE: Isolated SubjectPillsRow component
// ═══════════════════════════════════════════════════════════════════
interface SubjectPillsRowProps {
  availableSubjects: string[];
  currentSubject: string;
  onSubjectPress: (subject: string) => void;
  onAddSubjectPress: () => void;
}

const SubjectPillsRow = React.memo(({ 
  availableSubjects, 
  currentSubject, 
  onSubjectPress,
  onAddSubjectPress 
}: SubjectPillsRowProps) => {
  const { theme } = useThemeContext();

  const renderPill = useCallback(({ item, index }: { item: string; index: number }) => (
    <SubjectPill
      key={`subject-${index}-${item}`}
      subject={item}
      isSelected={currentSubject === item}
      onPress={item === '+ Add subject' ? onAddSubjectPress : onSubjectPress}
      isAddButton={item === '+ Add subject'}
    />
  ), [currentSubject, onSubjectPress, onAddSubjectPress]);

  const keyExtractor = useCallback((item: string, index: number) => `subject-${index}-${item}`, []);

  const pillsData = React.useMemo(() => [...availableSubjects, '+ Add subject'], [availableSubjects]);

  return (
    <View style={[styles.pillsContainer, { backgroundColor: theme.card }]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScrollContent}
        keyboardShouldPersistTaps="handled"
        data={pillsData}
        renderItem={renderPill}
        keyExtractor={keyExtractor}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
});

SubjectPillsRow.displayName = 'SubjectPillsRow';

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE: Isolated ChatInputBar component
// ═══════════════════════════════════════════════════════════════════
interface ChatInputBarProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSendDisabled: boolean;
  loading: boolean;
  isSending: boolean;
}

const ChatInputBar = React.memo(({ 
  inputText, 
  onChangeText, 
  onSend, 
  isSendDisabled,
  loading,
  isSending 
}: ChatInputBarProps) => {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [inputFocused, setInputFocused] = useState(false);

  const handleFocus = useCallback(() => setInputFocused(true), []);
  const handleBlur = useCallback(() => setInputFocused(false), []);

  const handleSubmit = useCallback(() => {
    if (!isSendDisabled) {
      onSend();
    }
  }, [isSendDisabled, onSend]);

  return (
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
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              multiline
              editable={!isSending && !loading}
              onSubmitEditing={handleSubmit}
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
          onPress={onSend}
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
  );
});

ChatInputBar.displayName = 'ChatInputBar';

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
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track current subject in state
  const [currentSubject, setCurrentSubject] = useState<string>('General');

  // Subject pill state
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(DEFAULT_SUBJECTS);

  // CRITICAL: Track last processed user message ID to prevent loops
  const lastProcessedUserMessageIdRef = useRef<string | null>(null);
  const isGeneratingRef = useRef(false);

  // FlatList ref for scrolling
  const flatListRef = useRef<FlatList>(null);

  // ═══════════════════════════════════════════════════════════════════
  // NEW: Robust scroll-to-bottom tracking refs
  // ═══════════════════════════════════════════════════════════════════
  const isNearBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(false);

  // Track if we've done initial scroll
  const hasInitialScrolledRef = useRef(false);

  // Dev-only debug state - ONLY stored in __DEV__ mode
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Track app state for detecting backgrounding
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // ═══════════════════════════════════════════════════════════════════
  // TYPING INDICATOR TIMEOUT: Force-clear after 15 seconds
  // ═══════════════════════════════════════════════════════════════════
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Memory saved indicator state
  const [showMemorySavedIndicator, setShowMemorySavedIndicator] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // DEFENSIVE CLEANUP: Force-clear typing indicator on unmount
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      // Clear typing indicator on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      // Force typing to false (defensive cleanup)
      setIsTyping(false);
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
      
      // ═══════════════════════════════════════════════════════════════════
      // DEFENSIVE: Clear typing indicator when app goes to background
      // ═══════════════════════════════════════════════════════════════════
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (isTyping) {
          console.log('[Chat] App backgrounded - clearing typing indicator');
          setIsTyping(false);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isTyping]);

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

  // ═══════════════════════════════════════════════════════════════════
  // NEW: Robust scrollToBottom helper function
  // Uses requestAnimationFrame + setTimeout for reliable scrolling
  // ═══════════════════════════════════════════════════════════════════
  const scrollToBottom = useCallback((animated: boolean = true) => {
    if (!flatListRef.current) {
      return;
    }

    // Use double requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated });
          // Reset auto-scroll flag after scrolling
          shouldAutoScrollRef.current = false;
        }, 50);
      });
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // NEW: Track scroll position to determine if user is near bottom
  // ═══════════════════════════════════════════════════════════════════
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    
    // Calculate if we're near the bottom (within 80px tolerance)
    const isNear = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
    isNearBottomRef.current = isNear;
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // NEW: Handle content size change - scroll when appropriate
  // ═══════════════════════════════════════════════════════════════════
  const handleContentSizeChange = useCallback(() => {
    // Only auto-scroll if:
    // 1. User is near bottom OR
    // 2. shouldAutoScrollRef is true (message was just sent/received)
    if (isNearBottomRef.current || shouldAutoScrollRef.current) {
      scrollToBottom(false);
    }
  }, [scrollToBottom]);

  // ═══════════════════════════════════════════════════════════════════
  // NEW: Keyboard listeners for auto-scrolling
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (__DEV__) {
        console.log('[Chat] Keyboard shown - scrolling to bottom');
      }
      scrollToBottom(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (__DEV__) {
        console.log('[Chat] Keyboard hidden - scrolling to bottom');
      }
      scrollToBottom(true);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [scrollToBottom]);

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
        
        // A) Scroll to bottom after loading messages successfully
        shouldAutoScrollRef.current = true;
        setTimeout(() => {
          scrollToBottom(false);
        }, 100);
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
  }, [personId, authUser?.id, backfillSubjects, getCurrentTherapistMetadata, scrollToBottom]);

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

  // ═══════════════════════════════════════════════════════════════════
  // F) Scroll to bottom when currentSubject changes (switching tabs)
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!loading && messageListItems.length > 0) {
      console.log('[Chat] Subject changed - scrolling to bottom');
      shouldAutoScrollRef.current = true;
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    }
  }, [currentSubject, loading, messageListItems.length, scrollToBottom]);

  // ═══════════════════════════════════════════════════════════════════
  // D) & E) Scroll when typing indicator changes
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isTyping) {
      console.log('[Chat] Typing indicator appeared - scrolling to bottom');
      shouldAutoScrollRef.current = true;
      scrollToBottom(true);
    } else {
      console.log('[Chat] Typing indicator removed - scrolling to bottom');
      shouldAutoScrollRef.current = true;
      scrollToBottom(true);
    }
  }, [isTyping, scrollToBottom]);

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

  // ═══════════════════════════════════════════════════════════════════
  // HELPER: Clear typing indicator and timeout
  // ═══════════════════════════════════════════════════════════════════
  const clearTypingIndicator = useCallback(() => {
    console.log('[Chat] Clearing typing indicator');
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // HELPER: Insert fallback message when AI fails
  // ═══════════════════════════════════════════════════════════════════
  const insertFallbackMessage = useCallback(async (fallbackText: string) => {
    if (!authUser?.id || !personId) {
      if (__DEV__) {
        console.warn('[Chat] insertFallbackMessage: Missing userId or personId');
      }
      return;
    }

    console.log('[Chat] Inserting fallback message');
    
    const therapistMeta = getCurrentTherapistMetadata();
    
    try {
      const { data: fallbackInserted, error: fallbackError } = await supabase
        .from('messages')
        .insert({
          user_id: authUser.id,
          person_id: personId,
          role: 'assistant',
          content: fallbackText,
          subject: currentSubject,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (fallbackError) {
        if (__DEV__) {
          console.error('[Chat] Failed to insert fallback message to DB:', fallbackError);
        }
        return;
      }

      if (fallbackInserted && isMountedRef.current) {
        const fallbackWithMeta: ExtendedMessage = {
          ...fallbackInserted,
          therapist_name: therapistMeta.name,
          therapist_avatar_source: therapistMeta.avatarSource,
        };
        setAllMessages((prev) => [...prev, fallbackWithMeta]);
        
        // C) Scroll after adding assistant message
        shouldAutoScrollRef.current = true;
        scrollToBottom(true);
      }
    } catch (err) {
      if (__DEV__) {
        console.error('[Chat] insertFallbackMessage exception:', err);
      }
    }
  }, [authUser?.id, personId, currentSubject, getCurrentTherapistMetadata, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();

    // ═══════════════════════════════════════════════════════════════════
    // DEFENSIVE GUARD 1: Validate required inputs BEFORE setting isTyping
    // ═══════════════════════════════════════════════════════════════════
    const userId = authUser?.id;
    
    if (!userId) {
      if (__DEV__) {
        console.warn('[Chat] sendMessage: Missing userId');
      }
      showErrorToast('You must be logged in to send messages');
      return;
    }

    if (!personId) {
      if (__DEV__) {
        console.warn('[Chat] sendMessage: Missing personId');
      }
      showErrorToast('Invalid person ID');
      return;
    }

    if (!currentSubject) {
      if (__DEV__) {
        console.warn('[Chat] sendMessage: Missing subject');
      }
      showErrorToast('Please select a subject');
      return;
    }

    if (!text) {
      if (__DEV__) {
        console.warn('[Chat] sendMessage: Empty message text');
      }
      return;
    }

    // STEP 1: In-flight guard - prevent multiple rapid sends
    if (isSending) {
      if (__DEV__) {
        console.log('[Chat] sendMessage: Already sending, ignoring duplicate call');
      }
      return;
    }

    if (isGeneratingRef.current) {
      if (__DEV__) {
        console.log('[Chat] sendMessage: Already generating, skipping');
      }
      return;
    }

    console.log('[Chat] sendMessage: Starting send process');
    console.log('[Chat] Current subject:', currentSubject);
    console.log('[Chat] chatId (personId):', personId);
    
    // Get current therapist metadata for this message
    const therapistMeta = getCurrentTherapistMetadata();
    console.log('[Chat] Current therapist:', therapistMeta.name);
    
    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL: Set flags and clear typing IMMEDIATELY
    // ═══════════════════════════════════════════════════════════════════
    setIsSending(true);
    isGeneratingRef.current = true;
    setError(null);
    
    // PRODUCTION SAFETY: Clear debug info in production builds
    if (__DEV__) {
      setDebugInfo(null);
    }
    
    // Clear input immediately to prevent re-sends
    const userMessageText = text;
    setInputText('');

    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL: Start typing indicator + timeout BEFORE any async work
    // ═══════════════════════════════════════════════════════════════════
    setIsTyping(true);
    
    // Start hard timeout to force-clear typing indicator after 15 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (__DEV__) {
        console.warn('[Chat] ⚠️ HARD TIMEOUT: Force-clearing typing indicator after 15s');
      }
      if (isMountedRef.current) {
        setIsTyping(false);
        // Insert fallback message on timeout
        insertFallbackMessage("I'm having trouble responding right now. Please try again.");
      }
      typingTimeoutRef.current = null;
    }, TYPING_TIMEOUT_MS);

    try {
      console.log('[Chat] Inserting user message...');
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
          console.error('[Chat] Insert user message error:', insertError);
        }
        if (isMountedRef.current) {
          setInputText(userMessageText); // Restore input on error
          setError(insertError?.message || 'Failed to send message. Please try again.');
        }
        return; // Early return, finally block will reset flags
      }

      console.log('[Chat] User message inserted:', insertedMessage.id);
      
      lastProcessedUserMessageIdRef.current = insertedMessage.id;

      let updatedMessages: ExtendedMessage[] = [];
      if (isMountedRef.current) {
        setAllMessages((prev) => {
          updatedMessages = [...prev, insertedMessage];
          return updatedMessages;
        });
        
        // B) Scroll after adding user message
        shouldAutoScrollRef.current = true;
        scrollToBottom(true);
      }

      // ═══════════════════════════════════════════════════════════════════
      // MEMORY CAPTURE: Fire-and-forget capture of factual statements
      // ═══════════════════════════════════════════════════════════════════
      console.log('[Chat] 🧠 Triggering memory capture...');
      
      // Check continuity setting first
      getPersonContinuity(userId, personId).then((continuityData) => {
        const continuityEnabled = continuityData.continuity_enabled;
        
        console.log('[Chat] Memory capture - continuity enabled:', continuityEnabled);
        
        if (continuityEnabled) {
          console.log('[Chat] Memory capture - calling captureMemoriesFromMessage');
          captureMemoriesFromMessage(
            userId,
            personId,
            userMessageText,
            personName,
            currentSubject
          ).catch((err) => {
            if (__DEV__) {
              console.log('[Chat] Memory capture failed (silent):', err?.message || 'unknown');
            }
          });
        } else {
          console.log('[Chat] Memory capture - skipped (continuity disabled)');
        }
      }).catch((err) => {
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
      try {
        console.log('[Chat] Running local memory extraction...');
        const extractedMemories = extractMemoriesFromUserText(userMessageText, personName);
        
        if (extractedMemories.length > 0) {
          console.log('[Chat] Extracted', extractedMemories.length, 'memories locally');
          await upsertPersonMemories(userId, personId, extractedMemories);
          console.log('[Chat] Local memories upserted successfully');
          
          if (isMountedRef.current) {
            setShowMemorySavedIndicator(true);
          }
        } else {
          console.log('[Chat] No memories extracted from user text');
        }
      } catch (memoryError: any) {
        if (__DEV__) {
          console.log('[Chat] Local memory extraction failed (silent):', memoryError?.message || 'unknown');
        }
      }

      console.log('[Chat] Calling AI Edge Function...');
      console.log('[Chat] Total messages in history:', updatedMessages.length);

      const subjectMessages = updatedMessages.filter((msg) => {
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

      console.log('[Chat] Sending to AI:', {
        chatId: personId,
        messageCount: recentMessages.length,
        lastUserMessageId: insertedMessage.id,
        subject: currentSubject,
        aiToneId: preferences.ai_tone_id,
        aiScienceMode: preferences.ai_science_mode,
      });

      const lastAssistantMessage = subjectMessages
        .filter((m) => m.role === 'assistant')
        .slice(-1)[0];

      // STEP 2: Call invokeEdgeSafe with retry and timeout logic
      const result = await invokeEdgeSafe('generate-ai-response', {
        userId,
        personId,
        personName,
        personRelationshipType: relationshipType || 'Unknown',
        messages: recentMessages,
        currentSubject: currentSubject,
        aiToneId: preferences.ai_tone_id,
        aiScienceMode: preferences.ai_science_mode,
      });

      // STEP 3: Handle result - check ok flag
      if (!result.ok) {
        const errorCode = result.error?.code || 'UNKNOWN';
        const errorMessage = result.error?.message || 'Unknown error';
        const errorStatus = result.error?.status;

        if (__DEV__) {
          console.error('[Chat] Edge Function failed:', {
            code: errorCode,
            message: errorMessage,
            status: errorStatus,
            details: result.error?.details,
          });

          const debugString = JSON.stringify({
            functionName: 'generate-ai-response',
            timestamp: new Date().toISOString(),
            lastUserMessageId: insertedMessage.id,
            error: result.error,
          }, null, 2);

          setDebugInfo(debugString);

          if (errorCode === 'EDGE_AUTH' || errorStatus === 401 || errorStatus === 403) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔐 EDGE AUTH FAILED - CHECK:');
            console.log('   1. SUPABASE_URL is correct');
            console.log('   2. ANON_KEY is correct');
            console.log('   3. Edge Function name is correct');
            console.log('   4. RLS policies allow access');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          }
        }

        if (isMountedRef.current) {
          // ═══════════════════════════════════════════════════════════════════
          // STEP 4: Handle different error types with fallback messages
          // ═══════════════════════════════════════════════════════════════════
          
          // Handle EDGE_ABORTED or EDGE_TIMEOUT - NO fallback message
          if (errorCode === 'EDGE_ABORTED' || errorCode === 'EDGE_TIMEOUT') {
            if (__DEV__) {
              console.log('[Chat] Abort/Timeout detected - showing clean error, no fallback message');
            }
            
            setError('Connection interrupted. Please try again.');
            return;
          }
          
          // ═══════════════════════════════════════════════════════════════════
          // FALLBACK MESSAGES: For all other error types
          // ═══════════════════════════════════════════════════════════════════
          
          let fallbackText = "I'm having trouble responding right now. Please try again.";
          let errorText = 'An error occurred. Please try again.';
          
          if (errorCode === 'EDGE_AUTH') {
            fallbackText = "I'm having trouble connecting right now. Please try logging out and back in.";
            errorText = 'Authentication issue. Please try logging out and back in.';
          } else if (errorCode === 'EDGE_UNAVAILABLE' || errorCode === 'FUNCTIONS_HTTP_ERROR') {
            fallbackText = "I'm having trouble responding right now. Please try again in a moment.";
            errorText = 'Service temporarily unavailable. Please try again.';
          } else if (errorCode === 'MAX_RETRIES_EXCEEDED') {
            fallbackText = "I'm having persistent connection issues. Please check your network and try again.";
            errorText = 'Connection issues. Please check your network.';
          }
          
          // Insert fallback message
          await insertFallbackMessage(fallbackText);
          setError(errorText);
        }

        return;
      }

      // ═══════════════════════════════════════════════════════════════════
      // DEFENSIVE GUARD 2: Validate AI response is not empty/null/whitespace
      // ═══════════════════════════════════════════════════════════════════
      const aiResponse = result.data;
      let replyText = aiResponse?.reply;

      // Check if reply is empty, null, or whitespace
      if (!replyText || typeof replyText !== 'string' || !replyText.trim()) {
        if (__DEV__) {
          console.error('[Chat] AI returned empty/null/whitespace reply:', {
            reply: replyText,
            type: typeof replyText,
          });
        }

        // Treat as error - insert fallback message
        if (isMountedRef.current) {
          await insertFallbackMessage("I'm having trouble responding right now. Please try again.");
          setError('AI response was empty. Please try again.');
        }
        return;
      }

      // Trim the reply
      replyText = replyText.trim();

      // Check for loop detection
      if (lastAssistantMessage && areSimilar(replyText, lastAssistantMessage.content)) {
        if (__DEV__) {
          console.warn('[Chat] Loop detected! AI response is too similar to previous response');
          console.log('[Chat] Previous:', lastAssistantMessage.content.substring(0, 50));
          console.log('[Chat] Current:', replyText.substring(0, 50));
        }
        
        replyText = `I hear you. Can you tell me more about what you're experiencing with ${personName}?`;
      }

      console.log('[Chat] Inserting AI message...');
      const { data: aiInserted, error: aiInsertError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          person_id: personId,
          role: 'assistant',
          content: replyText,
          subject: currentSubject,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (aiInsertError || !aiInserted) {
        if (__DEV__) {
          console.error('[Chat] Insert AI message error:', aiInsertError);
        }
        if (isMountedRef.current) {
          setError(aiInsertError?.message || 'Failed to save AI reply.');
          // Insert fallback message if we couldn't save the AI response
          await insertFallbackMessage("I'm having trouble responding right now. Please try again.");
        }
        return;
      }

      console.log('[Chat] AI message inserted:', aiInserted.id);

      // Attach therapist metadata to the AI message
      const aiMessageWithMeta: ExtendedMessage = {
        ...aiInserted,
        therapist_name: therapistMeta.name,
        therapist_avatar_source: therapistMeta.avatarSource,
      };

      if (isMountedRef.current) {
        setAllMessages((prev) => [...prev, aiMessageWithMeta]);
        
        // C) Scroll after adding assistant message
        shouldAutoScrollRef.current = true;
        scrollToBottom(true);
      }
      console.log('[Chat] sendMessage: Complete');

      // MEMORY EXTRACTION + CONTINUITY UPDATE: Background task
      (async () => {
        try {
          console.log('[Chat] Triggering memory extraction and continuity update...');
          
          const existingMemories = await getPersonMemories(userId, personId, 50);
          
          const userMessages = subjectMessages
            .filter(m => m.role === 'user')
            .slice(-5)
            .map(m => m.content);

          const extractionResult = await extractMemories({
            personName,
            recentUserMessages: userMessages,
            lastAssistantMessage: replyText,
            existingMemories: existingMemories.map(m => ({
              key: m.key,
              value: m.value,
              category: m.category,
            })),
            userId,
            personId,
          });
          
          console.log('[Chat] Memory extraction complete');
          
          if (isMountedRef.current && !extractionResult.error) {
            setShowMemorySavedIndicator(true);
          }
          
          if (extractionResult.continuity) {
            console.log('[Chat] Updating conversation continuity...');
            await upsertPersonContinuity(userId, personId, extractionResult.continuity);
            console.log('[Chat] Continuity updated successfully');
          }
        } catch (memoryError) {
          if (__DEV__) {
            console.log('[Chat] Memory extraction/continuity update failed (silent):', memoryError);
          }
        }
      })();
    } catch (err: any) {
      if (__DEV__) {
        console.error('[Chat] sendMessage unexpected error:', err);
      }
      
      if (isMountedRef.current) {
        setInputText(userMessageText);
        setError(err?.message || 'An unexpected error occurred');
        // Insert fallback message on unexpected error
        await insertFallbackMessage("I'm having trouble responding right now. Please try again.");
      }
    } finally {
      // ═══════════════════════════════════════════════════════════════════
      // CRITICAL: Always reset flags and clear typing in finally block
      // This ensures typing indicator is ALWAYS cleared, no matter what
      // ═══════════════════════════════════════════════════════════════════
      if (isMountedRef.current) {
        setIsSending(false);
        isGeneratingRef.current = false;
        // Final safety: ensure typing is cleared
        clearTypingIndicator();
      }
      
      console.log('[Chat] sendMessage: Finally block complete - all flags reset');
    }
  }, [authUser?.id, inputText, isSending, personId, personName, relationshipType, currentSubject, areSimilar, preferences.ai_science_mode, preferences.ai_tone_id, getCurrentTherapistMetadata, clearTypingIndicator, insertFallbackMessage, scrollToBottom]);

  const isSendDisabled = !inputText.trim() || isSending || loading;

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

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE: Memoized renderListItem with stable callback
  // ═══════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE: Stable keyExtractor
  // ═══════════════════════════════════════════════════════════════════
  const keyExtractor = useCallback((item: MessageListItem, index: number) => {
    if (item.type === 'date-separator') {
      return `date-${item.date.toISOString()}-${index}`;
    }
    return item.data.id;
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE: Memoized empty list component
  // ═══════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE: Memoized footer component (typing indicator)
  // This is isolated so typing indicator updates don't re-render messages
  // ═══════════════════════════════════════════════════════════════════
  const renderListFooter = useCallback(() => {
    // ═══════════════════════════════════════════════════════════════════
    // CRITICAL: Only render typing indicator when isTyping is true
    // This ensures the component fully unmounts when not needed
    // ═══════════════════════════════════════════════════════════════════
    if (!isTyping) return null;
    
    const therapistMeta = getCurrentTherapistMetadata();
    
    return (
      <AnimatedTypingIndicator 
        therapistAvatarSource={therapistMeta.avatarSource}
        therapistPersonaId={preferences.therapist_persona_id}
        therapistName={therapistMeta.name}
      />
    );
  }, [isTyping, getCurrentTherapistMetadata, preferences.therapist_persona_id]);

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE: Memoized input change handler (debounced if needed)
  // ═══════════════════════════════════════════════════════════════════
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  return (
    <FullScreenSwipeHandler enabled={!isTyping && !isSending}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* ═══════════════════════════════════════════════════════════════════
              ISOLATED: Chat Header Component
              ═══════════════════════════════════════════════════════════════════ */}
          <ChatHeader
            personName={personName}
            relationshipType={relationshipType}
            isPremium={isPremium}
            isTopicChat={isTopicChat}
            personId={personId}
            onBackPress={handleBackPress}
          />

          {/* ═══════════════════════════════════════════════════════════════════
              ISOLATED: Subject Pills Row Component
              ═══════════════════════════════════════════════════════════════════ */}
          <SubjectPillsRow
            availableSubjects={availableSubjects}
            currentSubject={currentSubject}
            onSubjectPress={handleSubjectPress}
            onAddSubjectPress={openAddSubjectModal}
          />

          {/* Memory Saved Indicator */}
          <MemorySavedIndicator 
            visible={showMemorySavedIndicator}
            onHide={() => setShowMemorySavedIndicator(false)}
          />

          {/* 
            ═══════════════════════════════════════════════════════════════════
            DEVELOPER DEBUG BANNER
            ═══════════════════════════════════════════════════════════════════
          */}
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

          {/* ═══════════════════════════════════════════════════════════════════
              OPTIMIZED: FlatList with performance props and auto-scroll
              ═══════════════════════════════════════════════════════════════════ */}
          <FlatList
            ref={flatListRef}
            data={messageListItems}
            renderItem={renderListItem}
            keyExtractor={keyExtractor}
            inverted={false}
            contentContainerStyle={[
              styles.messagesContent,
              {
                paddingBottom: insets.bottom + INPUT_HEIGHT_BUFFER,
              }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={renderEmptyList}
            ListFooterComponent={renderListFooter}
            removeClippedSubviews={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            getItemLayout={undefined}
          />

          {/* ═══════════════════════════════════════════════════════════════════
              ISOLATED: Chat Input Bar Component
              ═══════════════════════════════════════════════════════════════════ */}
          <ChatInputBar
            inputText={inputText}
            onChangeText={handleInputChange}
            onSend={sendMessage}
            isSendDisabled={isSendDisabled}
            loading={loading}
            isSending={isSending}
          />
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
