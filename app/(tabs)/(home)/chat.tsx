
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
import { ChatBubble } from '@/components/ui/ChatBubble';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { FullScreenSwipeHandler } from '@/components/ui/FullScreenSwipeHandler';
import { SwipeableModal } from '@/components/ui/SwipeableModal';
import { showErrorToast } from '@/utils/toast';
import { extractMemories } from '@/lib/memory/extractMemories';
import { getPersonMemories, upsertPersonMemories } from '@/lib/memory/personMemory';
import { upsertPersonContinuity } from '@/lib/memory/personSummary';
import { extractMemoriesFromUserText } from '@/lib/memory/localExtract';
import { invokeEdge, copyDebugToClipboard } from '@/lib/supabase/invokeEdge';

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
      console.error('[Chat] Missing personId parameter - navigation may be broken');
      showErrorToast('Invalid person ID');
    }
    if (!personName || personName === 'Chat') {
      console.warn('[Chat] Missing personName parameter - using fallback');
    }
  }, [personId, personName]);

  const { currentUser: authUser, role, isPremium } = useAuth();
  const { theme } = useThemeContext();
  const { preferences } = useUserPreferences();

  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  // Track current subject in state
  const [currentSubject, setCurrentSubject] = useState<string>('General');

  // Subject pill state
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(DEFAULT_SUBJECTS);

  // CRITICAL: Track last processed user message ID to prevent loops
  const lastProcessedUserMessageIdRef = useRef<string | null>(null);
  const isGeneratingRef = useRef(false);

  // FlatList ref for inverted list
  const flatListRef = useRef<FlatList>(null);

  // Dev-only debug state
  const [debugInfo, setDebugInfo] = useState<any>(null);

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

  const isFreeUser = role === 'free';

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
        console.error('[Chat] Backfill error:', updateError);
      } else {
        console.log('[Chat] Backfill completed successfully');
      }
    } catch (err) {
      console.error('[Chat] Backfill unexpected error:', err);
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
        console.error('[Chat] loadMessages error', error);
        if (isMountedRef.current) {
          setError('Failed to load messages');
        }
        return;
      }

      console.log('[Chat] Messages loaded:', data?.length || 0);
      
      if (isMountedRef.current) {
        setAllMessages(data ?? []);
      }

      backfillSubjects();
    } catch (err: any) {
      console.error('[Chat] loadMessages unexpected error:', err);
      if (isMountedRef.current) {
        setError('An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [personId, authUser?.id, backfillSubjects]);

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

  // REVERSED messages for inverted FlatList
  const reversedMessages = React.useMemo(() => {
    return [...displayedMessages].reverse();
  }, [displayedMessages]);

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

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();

    // STEP 1: In-flight guard - prevent multiple rapid sends
    if (isSending) {
      console.log('[Chat] sendMessage: Already sending, ignoring duplicate call');
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

    if (isGeneratingRef.current) {
      console.log('[Chat] sendMessage: Already generating, skipping');
      return;
    }

    console.log('[Chat] sendMessage: Starting send process');
    console.log('[Chat] Current subject:', currentSubject);
    console.log('[Chat] chatId (personId):', personId);
    
    // Set in-flight flag immediately
    setIsSending(true);
    isGeneratingRef.current = true;
    setError(null);
    setDebugInfo(null); // Clear previous debug info
    
    // Clear input immediately to prevent re-sends
    const userMessageText = text;
    setInputText('');

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
        console.error('[Chat] Insert user message error:', insertError);
        if (isMountedRef.current) {
          setInputText(userMessageText); // Restore input on error
          setError(insertError?.message || 'Failed to send message. Please try again.');
        }
        return; // Early return, finally block will reset flags
      }

      console.log('[Chat] User message inserted:', insertedMessage.id);
      
      lastProcessedUserMessageIdRef.current = insertedMessage.id;

      let updatedMessages: Message[] = [];
      if (isMountedRef.current) {
        setAllMessages((prev) => {
          updatedMessages = [...prev, insertedMessage];
          return updatedMessages;
        });
      }

      // LOCAL MEMORY EXTRACTION: Extract memories from user text immediately
      // This runs even if the AI reply fails, ensuring memories are always saved
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

      console.log('[Chat] Calling AI Edge Function...');
      console.log('[Chat] Total messages in history:', updatedMessages.length);
      
      if (isMountedRef.current) {
        setIsTyping(true);
      }

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

      // STEP 2: Wrap Edge Function call in try/catch and handle ALL response shapes safely
      let aiResponse: any = null;
      let invokeError: any = null;
      let debug: any = null;

      try {
        const result = await invokeEdge('generate-ai-response', {
          userId,
          personId,
          personName,
          personRelationshipType: relationshipType || 'Unknown',
          messages: recentMessages,
          currentSubject: currentSubject,
          aiToneId: preferences.ai_tone_id,
          aiScienceMode: preferences.ai_science_mode,
        });

        aiResponse = result.data;
        invokeError = result.error;
        debug = result.debug;
      } catch (invokeException: any) {
        console.error('[Chat] invokeEdge threw exception:', invokeException);
        invokeError = {
          name: 'invoke_exception',
          message: invokeException?.message || 'Unexpected error calling Edge Function',
        };
        debug = {
          exceptionMessage: invokeException?.message,
          exceptionStack: invokeException?.stack,
        };
      }

      // STEP 3: Normalize response and build debug string
      const ok = aiResponse?.success === true;
      const errObj = aiResponse?.error ?? null;

      if (invokeError || !ok) {
        // Build detailed debug string
        const debugString = JSON.stringify({
          functionName: 'generate-ai-response',
          timestamp: new Date().toISOString(),
          invocationError: invokeError ? {
            name: invokeError.name,
            message: invokeError.message,
            status: invokeError.status,
          } : null,
          edgeFunctionError: errObj ? {
            code: typeof errObj === 'object' ? errObj.code : errObj,
            message: typeof errObj === 'object' ? errObj.message : 'Unknown error',
            details: typeof errObj === 'object' ? errObj.details : undefined,
          } : null,
          responseData: aiResponse ? JSON.stringify(aiResponse).substring(0, 300) : null,
          debug,
        }, null, 2);

        console.error('[Chat] Edge Function error detected');
        console.error('[Chat] Debug info:', debugString);

        // Store debug info for dev mode banner
        if (__DEV__) {
          setDebugInfo(debugString);
        }

        if (isMountedRef.current) {
          setIsTyping(false);
          
          // STEP 4: Insert ONE assistant bubble with error message
          const fallbackMessage = "I'm having trouble responding right now. Please try again.";
          const { data: fallbackInserted } = await supabase
            .from('messages')
            .insert({
              user_id: userId,
              person_id: personId,
              role: 'assistant',
              content: fallbackMessage,
              subject: currentSubject,
              created_at: new Date().toISOString(),
            })
            .select('*')
            .single();

          if (fallbackInserted) {
            setAllMessages((prev) => [...prev, fallbackInserted]);
          }
        }

        // STEP 5: Return without throwing - safe error handling
        return;
      }

      // Success path - extract reply
      let replyText =
        aiResponse?.reply ||
        "I'm having trouble responding right now. Please try again.";

      if (lastAssistantMessage && areSimilar(replyText, lastAssistantMessage.content)) {
        console.warn('[Chat] Loop detected! AI response is too similar to previous response');
        console.log('[Chat] Previous:', lastAssistantMessage.content.substring(0, 50));
        console.log('[Chat] Current:', replyText.substring(0, 50));
        
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
        console.error('[Chat] Insert AI message error:', aiInsertError);
        if (isMountedRef.current) {
          setIsTyping(false);
          setError(aiInsertError?.message || 'Failed to save AI reply.');
        }
        return;
      }

      console.log('[Chat] AI message inserted:', aiInserted.id);

      if (isMountedRef.current) {
        setAllMessages((prev) => [...prev, aiInserted]);
        setIsTyping(false);
      }
      console.log('[Chat] sendMessage: Complete');

      // MEMORY EXTRACTION + CONTINUITY UPDATE: Extract memories and update continuity in the background
      // This is fire-and-forget and will not block or delay the chat flow
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

          // Extract memories and continuity (await to get continuity data)
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
          
          // Update continuity if we got valid data
          if (extractionResult.continuity) {
            console.log('[Chat] Updating conversation continuity...');
            await upsertPersonContinuity(userId, personId, extractionResult.continuity);
            console.log('[Chat] Continuity updated successfully');
          }
        } catch (memoryError) {
          // Silently fail - memory extraction should never break chat
          console.log('[Chat] Memory extraction/continuity update failed (silent):', memoryError);
        }
      })();
    } catch (err: any) {
      console.error('[Chat] sendMessage unexpected error:', err);
      if (isMountedRef.current) {
        setInputText(userMessageText); // Restore input on error
        setError(err?.message || 'An unexpected error occurred');
        setIsTyping(false);
      }
    } finally {
      // CRITICAL: Always reset flags in finally block
      if (isMountedRef.current) {
        setIsSending(false);
        isGeneratingRef.current = false;
      }
    }
  }, [authUser?.id, inputText, isSending, personId, personName, relationshipType, currentSubject, areSimilar, preferences.ai_science_mode, preferences.ai_tone_id]);

  const isSendDisabled = !inputText.trim() || isSending || loading;

  const handleBackPress = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/(home)');
      }
    } catch (error) {
      console.error('[Chat] Back navigation error:', error);
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

    // TODO: Persist to Supabase if needed (currently local state only)
  }, [newSubjectName, availableSubjects, closeAddSubjectModal]);

  // Handle debug banner tap (copy to clipboard)
  const handleDebugBannerTap = useCallback(async () => {
    if (debugInfo) {
      await copyDebugToClipboard(debugInfo);
      showErrorToast('Debug info copied to clipboard');
    }
  }, [debugInfo]);

  // Render individual message item
  const renderMessageItem = useCallback(({ item }: ListRenderItemInfo<Message>) => {
    return (
      <ChatBubble
        message={item.content}
        isUser={item.role === 'user'}
        timestamp={item.created_at}
        animate={false}
      />
    );
  }, []);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: Message) => item.id, []);

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

  // Footer component (typing indicator at top of inverted list)
  const renderListFooter = useCallback(() => {
    if (!isTyping) return null;
    return <TypingIndicator />;
  }, [isTyping]);

  return (
    <FullScreenSwipeHandler enabled={!isTyping && !isSending}>
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

          {/* DEV-ONLY: Debug Banner */}
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
            <View style={[styles.errorBanner, { backgroundColor: '#FF3B30' }]}>
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
            </View>
          )}

          {/* INVERTED FlatList for chat messages */}
          <FlatList
            ref={flatListRef}
            data={reversedMessages}
            renderItem={renderMessageItem}
            keyExtractor={keyExtractor}
            inverted={true}
            maintainVisibleContentPosition={{
              minIndexForVisible: 1,
            }}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyList}
            ListFooterComponent={renderListFooter}
            removeClippedSubviews={Platform.OS === 'android'}
          />

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
                    editable={!isSending && !loading}
                    onSubmitEditing={() => {
                      if (!isSendDisabled) {
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
    paddingHorizontal: '5%',
    paddingVertical: 16,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: '10%',
    transform: [{ scaleY: -1 }], // Flip back for inverted list
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
  // NEW: Simple modal styles
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
