
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
import { Message } from '@/types/database.types';
import { IconSymbol } from '@/components/IconSymbol';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { FullScreenSwipeHandler } from '@/components/ui/FullScreenSwipeHandler';

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

  const { currentUser: authUser, role, isPremium } = useAuth();
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

  // Send message handler - UNIFIED FUNCTION
  async function sendMessage() {
    const text = inputText.trim();
    
    // Validation
    if (!text || isSending || !personId) {
      console.log('[Chat] sendMessage: validation failed', { text: !!text, isSending, personId });
      return;
    }

    const userId = authUser?.id;
    if (!userId) {
      console.warn('[Chat] sendMessage: No userId available');
      setError('You must be logged in to send messages');
      return;
    }

    console.log('[Chat] sendMessage: Starting send process');
    setIsSending(true);
    setError(null);
    setInputText('');

    try {
      // 1. Insert USER message into Supabase with ALL required fields
      console.log('[Chat] Inserting user message...');
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          person_id: personId,
          role: 'user',
          content: text,
          created_at: new Date().toISOString(), // Explicitly include timestamp
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('[Chat] Insert user message error:', insertError.message, insertError);
        setInputText(text); // Restore input
        setError(insertError.message || 'Failed to send message. Please try again.');
        setIsSending(false);
        return;
      }

      console.log('[Chat] User message inserted:', insertedMessage.id);
      
      // Show message immediately in UI
      setMessages(prev => [...prev, insertedMessage]);
      setTimeout(() => scrollToBottom(), 100);

      // 2. Call AI Edge Function with correct payload format
      console.log('[Chat] Calling AI Edge Function...');
      setIsTyping(true);

      // Build message history for AI (last 10 messages for context)
      const recentMessages = [...messages, insertedMessage].slice(-10).map(msg => ({
        sender: msg.role === 'user' ? 'user' as const : 'ai' as const,
        content: msg.content,
        createdAt: msg.created_at,
      }));

      const { data: aiResponse, error: fnError } = await supabase.functions.invoke(
        'generate-ai-response',
        {
          body: {
            personId: personId,
            messages: recentMessages,
          },
        }
      );

      if (fnError) {
        console.error('[Chat] AI function error:', fnError.message, fnError);
        setIsTyping(false);
        setIsSending(false);
        setError(fnError.message || 'Failed to generate AI reply. Please try again.');
        return;
      }

      console.log('[Chat] AI response received');
      
      const replyText = aiResponse?.reply || "I'm here with you. Tell me more about how you're feeling.";

      // 3. Insert AI message into Supabase
      console.log('[Chat] Inserting AI message...');
      const { data: aiInserted, error: aiInsertError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          person_id: personId,
          role: 'assistant',
          content: replyText,
          created_at: new Date().toISOString(), // Explicitly include timestamp
        })
        .select('*')
        .single();

      if (aiInsertError) {
        console.error('[Chat] Insert AI message error:', aiInsertError.message, aiInsertError);
        setIsTyping(false);
        setIsSending(false);
        setError(aiInsertError.message || 'Failed to save AI reply.');
        return;
      }

      console.log('[Chat] AI message inserted:', aiInserted.id);
      
      // Show AI message in UI
      setMessages(prev => [...prev, aiInserted]);
      setTimeout(() => scrollToBottom(), 100);

      // Success - clear all states
      setIsTyping(false);
      setIsSending(false);
      console.log('[Chat] sendMessage: Complete');
      
    } catch (err: any) {
      console.error('[Chat] sendMessage unexpected error:', err);
      setInputText(text); // Restore input
      setError(err.message || 'An unexpected error occurred');
      setIsTyping(false);
      setIsSending(false);
    }
  }

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

        {/* Error Banner */}
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
            <TouchableOpacity onPress={() => setError(null)} style={styles.dismissButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Messages */}
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
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message.content}
                  isUser={message.role === 'user'}
                  timestamp={message.created_at}
                  animate={false}
                />
              ))}
            </>
          )}

          {/* AI Typing Indicator */}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <View style={styles.inputRow}>
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
                  onSubmitEditing={() => {
                    if (!isSendDisabled) {
                      sendMessage();
                    }
                  }}
                />
              </View>
            </View>

            {/* Send button with paper plane icon */}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
    elevation: 2,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderRadius: 20,
    boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 4,
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
