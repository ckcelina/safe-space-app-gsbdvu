
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
import { generateAIReply } from '@/utils/aiHelpers';
import { showErrorToast } from '@/utils/toast';

export default function ChatScreen() {
  const { personId, personName, relationshipType } = useLocalSearchParams<{
    personId: string;
    personName: string;
    relationshipType?: string;
  }>();
  const { userId, isPremium } = useAuth();
  const { theme } = useThemeContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Character limits
  const MAX_CHARS = isPremium ? 1500 : 400;
  const isOverLimit = inputText.length > MAX_CHARS;

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

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleRetry = () => {
    fetchMessages();
  };

  const handleTextChange = (text: string) => {
    // Prevent typing beyond the limit
    if (text.length <= MAX_CHARS) {
      setInputText(text);
    }
  };

  const sendMessage = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || sending || !userId || !personId || isOverLimit) {
      return;
    }

    const messageContent = trimmedText;
    setInputText('');
    setSending(true);

    try {
      console.log('Sending user message:', messageContent);

      // 1. Insert user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert([
          {
            user_id: userId,
            person_id: personId,
            role: 'user',
            content: messageContent,
          },
        ])
        .select()
        .single();

      if (userError) {
        console.error('Error inserting user message:', userError);
        showErrorToast('Failed to send message. Please try again.');
        setInputText(messageContent); // Restore the message
        setSending(false);
        return;
      }

      console.log('User message inserted:', userMessage.id);
      
      // 2. Optimistically append user message to the list
      setMessages((prev) => [...prev, userMessage]);
      setTimeout(() => scrollToBottom(), 100);

      // 3. Show AI typing indicator
      setAiTyping(true);

      // 4. Generate AI reply via Edge Function
      const aiReplyText = await generateAIReply(personId, [...messages, userMessage]);
      
      // 5. Hide AI typing indicator
      setAiTyping(false);

      // 6. Handle AI reply error
      if (!aiReplyText) {
        console.error('Failed to generate AI reply');
        showErrorToast('Unable to generate AI response. Please try again.');
        setSending(false);
        return;
      }

      console.log('AI reply generated:', aiReplyText);

      // 7. Insert AI message
      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
        .insert([
          {
            user_id: userId,
            person_id: personId,
            role: 'assistant',
            content: aiReplyText,
          },
        ])
        .select()
        .single();

      if (aiError) {
        console.error('Error inserting AI message:', aiError);
        showErrorToast('AI response generated but failed to save.');
      } else {
        console.log('AI message inserted:', aiMessage.id);
        // 8. Append AI message to the list
        setMessages((prev) => [...prev, aiMessage]);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (err: any) {
      console.error('Unexpected error sending message:', err);
      showErrorToast('An unexpected error occurred');
      setInputText(messageContent); // Restore the message
      setAiTyping(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <FullScreenSwipeHandler enabled={!sending && !aiTyping}>
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
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{personName}</Text>
            {relationshipType && (
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {relationshipType}
              </Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>

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
                    isUser={message.role === 'user'}
                    timestamp={message.created_at}
                    animate={index === messages.length - 1}
                  />
                ))}
              </>
            )}

            {/* AI Typing Indicator */}
            {aiTyping && <TypingIndicator />}
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
                editable={!sending && !loading && !aiTyping}
              />
            </View>

            {/* Character limit warning for free users */}
            {!isPremium && inputText.length >= MAX_CHARS * 0.8 && (
              <View style={styles.limitWarning}>
                <Text style={[styles.limitWarningText, { color: inputText.length >= MAX_CHARS ? '#FF3B30' : theme.textSecondary }]}>
                  {inputText.length >= MAX_CHARS 
                    ? 'Upgrade to Premium to send longer messages.'
                    : `${inputText.length}/${MAX_CHARS} characters`
                  }
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.primary },
              (!inputText.trim() || sending || loading || isOverLimit || aiTyping) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending || loading || isOverLimit || aiTyping}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
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
  limitWarning: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  limitWarningText: {
    fontSize: 12,
    fontWeight: '500',
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
    opacity: 0.5,
  },
});
