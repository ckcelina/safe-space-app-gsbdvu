
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { FullScreenSwipeHandler } from '@/components/ui/FullScreenSwipeHandler';
import { SwipeableModal } from '@/components/ui/SwipeableModal';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { showErrorToast } from '@/utils/toast';
import { Screen } from '@/components/Screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default subjects list
const DEFAULT_SUBJECTS = [
  'General',
  'Work / Career',
  'Self-esteem & Confidence',
  'Mental Health & Disorders',
  'Family in General',
  'Romantic Relationships',
  'Friendships',
  'Studies / School',
  'Money & Finances',
];

// Quick select subjects (excluding General)
const QUICK_SELECT_SUBJECTS = DEFAULT_SUBJECTS.filter((s) => s !== 'General');

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

  const [addSubjectModalVisible, setAddSubjectModalVisible] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [quickSelectedSubject, setQuickSelectedSubject] = useState<string | null>(null);
  const [customSubjectFocused, setCustomSubjectFocused] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isFreeUser = role === 'free';

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (isMountedRef.current && scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, []);

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
        scrollToBottom();
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
  }, [personId, authUser?.id, scrollToBottom, backfillSubjects]);

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

  useEffect(() => {
    if (displayedMessages.length > 0) {
      scrollToBottom();
    }
  }, [displayedMessages.length, scrollToBottom]);

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

    if (!text || isSending || !personId) {
      console.log('[Chat] sendMessage: validation failed', {
        hasText: !!text,
        isSending,
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
    
    setIsSending(true);
    isGeneratingRef.current = true;
    setError(null);
    setInputText('');

    try {
      console.log('[Chat] Inserting user message...');
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          person_id: personId,
          role: 'user',
          content: text,
          subject: currentSubject,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (insertError || !insertedMessage) {
        console.error('[Chat] Insert user message error:', insertError);
        if (isMountedRef.current) {
          setInputText(text);
          setError(insertError?.message || 'Failed to send message. Please try again.');
          setIsSending(false);
          isGeneratingRef.current = false;
        }
        return;
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

      scrollToBottom();

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
      });

      const lastAssistantMessage = subjectMessages
        .filter((m) => m.role === 'assistant')
        .slice(-1)[0];

      const { data: aiResponse, error: fnError } = await supabase.functions.invoke(
        'generate-ai-response',
        {
          body: {
            personId,
            personName,
            personRelationshipType: relationshipType || 'Unknown',
            messages: recentMessages,
            currentSubject: currentSubject,
          },
        }
      );

      if (fnError) {
        console.error('[Chat] AI function error:', fnError);
        if (isMountedRef.current) {
          setIsTyping(false);
          setIsSending(false);
          isGeneratingRef.current = false;
          setError(
            (fnError as any)?.message ||
              'Failed to generate AI reply. Please try again.'
          );
        }
        return;
      }

      console.log('[Chat] AI response received');

      let replyText =
        aiResponse?.reply ||
        "I'm here with you. Tell me more about how you're feeling.";

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
          setIsSending(false);
          isGeneratingRef.current = false;
          setError(aiInsertError?.message || 'Failed to save AI reply.');
        }
        return;
      }

      console.log('[Chat] AI message inserted:', aiInserted.id);

      if (isMountedRef.current) {
        setAllMessages((prev) => [...prev, aiInserted]);
        scrollToBottom();
        setIsTyping(false);
        setIsSending(false);
        isGeneratingRef.current = false;
      }
      console.log('[Chat] sendMessage: Complete');
    } catch (err: any) {
      console.error('[Chat] sendMessage unexpected error:', err);
      if (isMountedRef.current) {
        setInputText(text);
        setError(err?.message || 'An unexpected error occurred');
        setIsTyping(false);
        setIsSending(false);
        isGeneratingRef.current = false;
      }
    }
  }, [authUser?.id, inputText, isSending, personId, personName, relationshipType, currentSubject, scrollToBottom, areSimilar]);

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

  const openAddSubjectModal = useCallback(() => {
    console.log('[Chat] Opening Add Subject modal');
    setAddSubjectModalVisible(true);
    setCustomSubjectInput('');
    setQuickSelectedSubject(null);
    setCustomSubjectFocused(false);
  }, []);

  const closeAddSubjectModal = useCallback(() => {
    console.log('[Chat] Closing Add Subject modal');
    setAddSubjectModalVisible(false);
    setCustomSubjectInput('');
    setQuickSelectedSubject(null);
    setCustomSubjectFocused(false);
  }, []);

  const handleQuickSubjectSelect = useCallback((subject: string) => {
    console.log('[Chat] Quick subject selected:', subject);
    setQuickSelectedSubject(subject);
  }, []);

  const saveSubject = useCallback(() => {
    const customSubject = customSubjectInput.trim();
    
    const newSubject = customSubject || quickSelectedSubject;

    if (!newSubject) {
      console.log('[Chat] No subject to save');
      closeAddSubjectModal();
      return;
    }

    console.log('[Chat] Saving subject:', newSubject);

    setAvailableSubjects((prev) => {
      if (!prev.includes(newSubject)) {
        return [...prev, newSubject];
      }
      return prev;
    });

    setCurrentSubject(newSubject);
    closeAddSubjectModal();
  }, [customSubjectInput, quickSelectedSubject, closeAddSubjectModal]);

  return (
    <FullScreenSwipeHandler enabled={!isTyping && !isSending}>
      <KeyboardAvoider>
        <Screen headerBackgroundColor="#0B66C3">
          <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBarGradient />

          <View style={[styles.header, { backgroundColor: theme.card }]}>
            <TouchableOpacity 
              onPress={handleBackPress} 
              style={[
                styles.backButton,
                isTopicChat && { backgroundColor: theme.background }
              ]}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow_back"
                size={24}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {personName}
                </Text>
                {isPremium && !isTopicChat && (
                  <View style={styles.premiumBadgeSmall}>
                    <Text style={styles.premiumBadgeSmallText}>⭐</Text>
                  </View>
                )}
              </View>
              {relationshipType && (
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {relationshipType}
                </Text>
              )}
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Subject Pills Row */}
          <View style={[styles.pillsContainer, { backgroundColor: theme.card }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {availableSubjects.map((subject, index) => (
                <SubjectPill
                  key={`subject-${index}-${subject}`}
                  subject={subject}
                  isSelected={currentSubject === subject}
                  onPress={handleSubjectPress}
                />
              ))}
              <SubjectPill
                key="add-subject-button"
                subject="+ Add subject"
                isSelected={false}
                onPress={openAddSubjectModal}
                isAddButton={true}
              />
            </ScrollView>
          </View>

          {isFreeUser && (
            <View style={[styles.freeBanner, { backgroundColor: theme.card }]}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={16}
                color={theme.textSecondary}
                style={styles.bannerIcon}
              />
              <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
                You&apos;re on the free plan. In the future, free plans may have limits on
                daily messages.
              </Text>
            </View>
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

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
          >
            {displayedMessages.length === 0 && !loading ? (
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
            ) : (
              <React.Fragment>
                {displayedMessages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message.content}
                    isUser={message.role === 'user'}
                    timestamp={message.created_at}
                    animate={false}
                  />
                ))}
              </React.Fragment>
            )}

            {isTyping && <TypingIndicator />}
          </ScrollView>

          {/* Input Container - NO EXTRA PADDING, sits directly on keyboard */}
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
        </Screen>
      </KeyboardAvoider>

      <LoadingOverlay visible={loading && !error} />

      {/* Add Subject Modal */}
      <SwipeableModal
        visible={addSubjectModalVisible}
        onClose={closeAddSubjectModal}
        animationType="slide"
        showHandle={true}
      >
        <KeyboardAvoider>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Add a subject
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Choose what you&apos;d like to focus on in this conversation.
            </Text>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Select Subjects */}
              <View style={styles.quickSelectContainer}>
                <Text style={[styles.quickSelectLabel, { color: theme.textPrimary }]}>
                  Quick select:
                </Text>
                <View style={styles.quickSelectGrid}>
                  {QUICK_SELECT_SUBJECTS.map((subject, index) => (
                    <TouchableOpacity
                      key={`quick-${index}-${subject}`}
                      onPress={() => handleQuickSubjectSelect(subject)}
                      activeOpacity={0.7}
                      style={[
                        styles.quickSelectButton,
                        {
                          backgroundColor:
                            quickSelectedSubject === subject
                              ? theme.primary + '20'
                              : theme.background,
                          borderWidth: 1.5,
                          borderColor:
                            quickSelectedSubject === subject
                              ? theme.primary
                              : theme.textSecondary + '40',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickSelectText,
                          {
                            color:
                              quickSelectedSubject === subject
                                ? theme.primary
                                : theme.textPrimary,
                            fontWeight: quickSelectedSubject === subject ? '600' : '500',
                          },
                        ]}
                      >
                        {subject}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Subject Input */}
              <View style={styles.customInputContainer}>
                <Text style={[styles.customInputLabel, { color: theme.textPrimary }]}>
                  Custom subject:
                </Text>
                <View style={[
                  styles.customInputWrapper,
                  {
                    backgroundColor: theme.background,
                    borderWidth: customSubjectFocused ? 2 : 1.5,
                    borderColor: customSubjectFocused
                      ? theme.primary
                      : theme.textSecondary + '40',
                  },
                ]}>
                  <TextInput
                    style={[styles.customInput, { color: theme.textPrimary }]}
                    placeholder="Type your own subject..."
                    placeholderTextColor={theme.textSecondary}
                    value={customSubjectInput}
                    onChangeText={setCustomSubjectInput}
                    onFocus={() => setCustomSubjectFocused(true)}
                    onBlur={() => setCustomSubjectFocused(false)}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    maxLength={100}
                    returnKeyType="done"
                    onSubmitEditing={saveSubject}
                    autoFocus={false}
                    cursorColor={theme.primary}
                    selectionColor={Platform.OS === 'ios' ? theme.primary : theme.primary + '40'}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={closeAddSubjectModal}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={saveSubject}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Save subject
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoider>
      </SwipeableModal>
    </FullScreenSwipeHandler>
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
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    borderRadius: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    flexShrink: 1,
  },
  premiumBadgeSmall: {
    marginLeft: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
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
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: '5%',
    paddingVertical: 16,
    paddingBottom: 8,
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
  // Modal styles
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  quickSelectContainer: {
    marginBottom: 24,
  },
  quickSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickSelectText: {
    fontSize: 14,
  },
  customInputContainer: {
    marginBottom: 16,
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customInputWrapper: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  customInput: {
    fontSize: 16,
    lineHeight: 20,
    minHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
