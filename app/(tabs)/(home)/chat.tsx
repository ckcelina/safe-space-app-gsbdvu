
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { generateAIReply } from '@/lib/aiClient';
import { Message } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { FullScreenSwipeHandler } from '@/components/ui/FullScreenSwipeHandler';
import { showErrorToast } from '@/utils/toast';

export default function ChatScreen() {
  const { personId, personName, relationshipType } = useLocalSearchParams<{
    personId: string;
    personName: string;
    relationshipType?: string;
  }>();
  const { userId, role, isPremium } = useAuth();
  const { theme } = useThemeContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAITyping, setIsAITyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [showAIError, setShowAIError] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Determine if user is free
  const isFreeUser = role === 'free';

  const fetchMessages = useCallback(async () => {
    if (!userId || !personId) {
      console.log('Missing userId or personId');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching messages for person:', personId, 'user:', userId);
      
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .eq('person_id', personId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching messages:', fetchError);
        setError('Failed to load messages');
        showErrorToast('Failed to load messages');
      } else {
        console.log('Messages loaded:', data?.length || 0);
        setMessages(data || []);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching messages:', err);
      setError('An unexpected error occurred');
      showErrorToast('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [userId, personId]);

  useEffect(() => {
    if (userId && personId) {
      fetchMessages();
    }
  }, [userId, personId, fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleRetry = () => {
    fetchMessages();
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
  };

  const handleRetryAI = async () => {
    if (!lastUserMessage || !userId || !personId) {
      console.log('Cannot retry: missing data');
      return;
    }

    console.log('Retrying AI response for last message:', lastUserMessage);
    setShowAIError(false);
    setIsAITyping(true);

    try {
      // Prepare recent messages (last ~20) for AI
      const recentMessages = messages.slice(-20).map((m) => ({
        sender: (m.sender || (m.role === 'assistant' ? 'ai' : 'user')) as 'user' | 'ai',
        content: m.content,
      }));

      console.log('Calling generateAIReply with', recentMessages.length, 'messages');
      
      // Call generateAIReply
      const result = await generateAIReply(personId, recentMessages);

      if (result.success) {
        console.log('AI reply generated:', result.reply.substring(0, 50) + '...');

        // Insert AI message with sender = 'ai'
        const { data: aiMessage, error: aiError } = await supabase
          .from('messages')
          .insert([
            {
              user_id: userId,
              person_id: personId,
              sender: 'ai',
              role: 'assistant',
              content: result.reply,
            },
          ])
          .select()
          .single();

        if (aiError) {
          console.error('Error inserting AI message:', aiError);
          // Still show the AI reply locally even if insert fails
          const fallbackMessage: Message = {
            id: `fallback-${Date.now()}`,
            user_id: userId,
            person_id: personId,
            sender: 'ai',
            role: 'assistant',
            content: result.reply,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, fallbackMessage]);
        } else {
          console.log('AI message inserted:', aiMessage.id);
          setMessages((prev) => [...prev, aiMessage]);
        }

        setLastUserMessage(null);
        setShowAIError(false);
      } else {
        console.error('AI reply failed:', result.error);
        setShowAIError(true);
      }

      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      console.error('Unexpected error retrying AI:', err);
      setShowAIError(true);
    } finally {
      setIsAITyping(false);
    }
  };

  const sendMessage = async () => {
    const trimmedText = inputText.trim();
    
    // Step 1: If input is empty, do nothing
    if (!trimmedText || !userId || !personId) {
      console.log('Send blocked: empty text or missing user/person');
      return;
    }

    const messageContent = trimmedText;
    
    // Step 2: Clear input immediately
    setInputText('');
    setShowAIError(false);

    try {
      console.log('Sending user message:', messageContent);

      // Step 3: Insert the user message into public.messages
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert([
          {
            user_id: userId,
            person_id: personId,
            sender: 'user',
            role: 'user',
            content: messageContent,
          },
        ])
        .select()
        .single();

      if (userError) {
        console.error('Error inserting user message:', userError);
        showErrorToast("Couldn't send, please try again.");
        return;
      }

      console.log('User message inserted:', userMessage.id);
      
      // Step 4: Immediately show this new message in the chat list
      setMessages((prev) => [...prev, userMessage]);
      setTimeout(() => scrollToBottom(), 100);

      // Step 5: Set isAITyping flag to true
      setIsAITyping(true);
      setLastUserMessage(messageContent);

      // Step 6: Prepare recent messages (last ~20) for AI
      const allMessages = [...messages, userMessage];
      const recentMessages = allMessages.slice(-20).map((m) => ({
        sender: (m.sender || (m.role === 'assistant' ? 'ai' : 'user')) as 'user' | 'ai',
        content: m.content,
      }));

      console.log('Calling generateAIReply with', recentMessages.length, 'messages');
      
      // Step 7: Call generateAIReply
      const result = await generateAIReply(personId, recentMessages);

      if (result.success) {
        console.log('AI reply generated:', result.reply.substring(0, 50) + '...');

        // Step 8: Insert AI message with sender = 'ai'
        const { data: aiMessage, error: aiError } = await supabase
          .from('messages')
          .insert([
            {
              user_id: userId,
              person_id: personId,
              sender: 'ai',
              role: 'assistant',
              content: result.reply,
            },
          ])
          .select()
          .single();

        if (aiError) {
          console.error('Error inserting AI message:', aiError);
          // Still show the AI reply locally even if insert fails
          const fallbackMessage: Message = {
            id: `fallback-${Date.now()}`,
            user_id: userId,
            person_id: personId,
            sender: 'ai',
            role: 'assistant',
            content: result.reply,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, fallbackMessage]);
        } else {
          console.log('AI message inserted:', aiMessage.id);
          // Step 9: Append AI message to the list
          setMessages((prev) => [...prev, aiMessage]);
        }

        setLastUserMessage(null);
        setShowAIError(false);
      } else {
        // AI failed - show error message
        console.error('AI reply failed:', result.error);
        setShowAIError(true);
      }

      // Step 10: Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      console.error('Unexpected error sending message:', err);
      // If any error, show error state
      setShowAIError(true);
    } finally {
      // Step 11: Always clear isAITyping in finally block
      setIsAITyping(false);
    }
  };

  // Send button should be disabled when input is empty or AI is typing
  const isSendDisabled = !inputText.trim() || isAITyping || loading;

  return (
    <FullScreenSwipeHandler enabled={!isAITyping}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <StatusBarGradient />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{personName}</Text>
              {isPremium && (
                <View style={styles.premiumBadgeSmall}>
                  <Text style={styles.premiumBadgeSmallText}>⭐</Text>
                </View>
              )}
            </View>
            {relationshipType && (
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {relationshipType}
              </Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Free User Banner */}
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
              You&apos;re on the free plan. In the future, free plans may have limits on daily messages.
            </Text>
          </View>
        )}

        {/* Messages */}
        {error ? (
          <View style={styles.errorContainer}>
            <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={32}
                color="#FF3B30"
              />
              <Text style={[styles.errorText, { color: theme.textPrimary }]}>{error}</Text>
              <TouchableOpacity
                onPress={handleRetry}
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.retryButtonText, { color: theme.buttonText }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollToBottom()}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && !loading ? (
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
              </View>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatBubble
                    key={index}
                    message={message.content}
                    isUser={(message.sender || message.role) === 'user'}
                    timestamp={message.created_at}
                    animate={index === messages.length - 1}
                  />
                ))}
              </>
            )}

            {/* AI Typing Indicator - shown while isAITyping is true */}
            {isAITyping && <TypingIndicator />}

            {/* AI Error Message with Retry button */}
            {showAIError && !isAITyping && (
              <View style={styles.aiErrorContainer}>
                <View style={[styles.aiErrorBubble, { backgroundColor: theme.card }]}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.circle.fill"
                    android_material_icon_name="error"
                    size={20}
                    color="#FF3B30"
                  />
                  <Text style={[styles.aiErrorText, { color: theme.textPrimary }]}>
                    I had trouble replying. Please try again.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.tryAgainButton, { backgroundColor: theme.primary }]}
                  onPress={handleRetryAI}
                  activeOpacity={0.8}
                >
                  <IconSymbol
                    ios_icon_name="arrow.clockwise"
                    android_material_icon_name="refresh"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.tryAgainButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <View style={styles.inputColumn}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="Tell me what's going on…"
                placeholderTextColor={theme.textSecondary}
                value={inputText}
                onChangeText={handleTextChange}
                multiline
                editable={!loading && !isAITyping}
              />
            </View>
          </View>

          {/* Send button: Dimmed + non-pressable when disabled, uses theme color when active */}
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
      </KeyboardAvoidingView>
      
      <LoadingOverlay visible={loading && !error} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  premiumBadgeSmall: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeSmallText: {
    fontSize: 12,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
    width: '100%',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  aiErrorContainer: {
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
  },
  aiErrorBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    gap: 8,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  aiErrorText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  tryAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 4,
  },
  inputColumn: {
    flex: 1,
  },
  inputWrapper: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
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
});
