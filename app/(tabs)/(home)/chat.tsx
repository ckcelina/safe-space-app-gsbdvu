
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
  const params = useLocalSearchParams<{
    personId: string;
    personName: string;
    relationshipType?: string;
  }>();
  
  const personId = params.personId;
  const personName = params.personName;
  const relationshipType = params.relationshipType;

  // Warn if params are missing but don't crash
  useEffect(() => {
    if (!personId) {
      console.warn('[Chat] Missing personId param');
    }
    if (!personName) {
      console.warn('[Chat] Missing personName param');
    }
  }, [personId, personName]);

  const { userId, role, isPremium } = useAuth();
  const { theme } = useThemeContext();
  
  // Local state as specified
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Determine if user is free
  const isFreeUser = role === 'free';

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Load messages on mount
  const loadMessages = useCallback(async () => {
    if (!personId) {
      console.warn('[Chat] loadMessages: personId is missing');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[Chat] Loading messages for person:', personId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[Chat] loadMessages error', error);
        setError('Failed to load messages');
        return;
      }

      console.log('[Chat] Messages loaded:', data?.length || 0);
      setMessages(data ?? []);
      
      // Scroll to bottom after loading messages
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      console.warn('[Chat] loadMessages unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  // Load messages on mount and when personId changes
  useEffect(() => {
    if (personId) {
      loadMessages();
    }
  }, [personId, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages.length]);

  const handleRetry = () => {
    loadMessages();
  };

  // Send message handler
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !personId || isSending) {
      console.log('[Chat] handleSend blocked:', { text: !!text, personId: !!personId, isSending });
      return;
    }

    if (!userId) {
      console.warn('[Chat] handleSend: userId is missing');
      showErrorToast('Unable to send message. Please try again.');
      return;
    }

    setIsSending(true);
    setInputText('');

    console.log('[Chat] Inserting user message:', text.substring(0, 50) + '...');

    // Insert user message
    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        person_id: personId,
        sender: 'user',
        content: text,
      })
      .select()
      .single();

    if (error) {
      console.warn('[Chat] send message error', error);
      showErrorToast("Couldn't send message. Please try again.");
      setInputText(text);
      setIsSending(false);
      return;
    }

    console.log('[Chat] User message inserted:', inserted.id);

    // Update UI immediately
    setMessages(prev => [...prev, inserted]);
    setTimeout(() => scrollToBottom(), 50);
    
    // Start AI reply process
    setIsTyping(true);

    try {
      // Prepare recent messages for AI context (last 10 messages)
      const allMessages = [...messages, inserted];
      const recentMessages = allMessages.slice(-10).map((m) => ({
        sender: (m.sender || (m.role === 'assistant' ? 'ai' : 'user')) as 'user' | 'ai',
        content: m.content,
      }));

      console.log('[Chat] Calling AI with', recentMessages.length, 'messages for context');
      
      // Call Edge Function to generate AI response
      const result = await generateAIReply(personId, recentMessages);

      if (result.success) {
        console.log('[Chat] AI reply received:', result.reply.substring(0, 50) + '...');

        // Insert AI message into database
        const { data: aiMessage, error: aiError } = await supabase
          .from('messages')
          .insert({
            user_id: userId,
            person_id: personId,
            sender: 'ai',
            content: result.reply,
          })
          .select()
          .single();

        if (aiError) {
          console.warn('[Chat] Error inserting AI message:', aiError);
          showErrorToast('Failed to save AI response');
          
          // Show AI reply locally even if database insert fails
          const fallbackMessage: Message = {
            id: `fallback-${Date.now()}`,
            user_id: userId,
            person_id: personId,
            sender: 'ai',
            content: result.reply,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, fallbackMessage]);
        } else {
          console.log('[Chat] AI message inserted:', aiMessage.id);
          setMessages((prev) => [...prev, aiMessage]);
        }
      } else {
        console.warn('[Chat] AI reply generation failed:', result.error);
        showErrorToast('AI had trouble replying. Please try again.');
      }

      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      console.warn('[Chat] Unexpected error generating AI reply:', err);
      showErrorToast('Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  // Send button is enabled when there's text and not sending
  const isSendDisabled = !inputText.trim() || isSending || loading;

  return (
    <FullScreenSwipeHandler enabled={!isTyping}>
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
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {personName || 'Chat'}
              </Text>
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
                  Share your thoughts and feelings about {personName || 'this person'}
                </Text>
              </View>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatBubble
                    key={message.id || index}
                    message={message.content}
                    isUser={(message.sender || message.role) === 'user'}
                    timestamp={message.created_at}
                    animate={index === messages.length - 1}
                  />
                ))}
              </>
            )}

            {/* AI Typing Indicator */}
            {isTyping && <TypingIndicator />}
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
                onChangeText={setInputText}
                multiline
                editable={!isSending && !loading}
              />
            </View>
          </View>

          {/* Send button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.primary },
              isSendDisabled && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={isSendDisabled}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="arrow.up.circle.fill"
              android_material_icon_name="arrow_upward"
              size={24}
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
    borderRadius: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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
    fontSize: 24,
    fontWeight: 'bold',
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
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
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
    borderRadius: 20,
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
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderRadius: 20,
    boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 4,
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
