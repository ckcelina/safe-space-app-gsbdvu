
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
  const { userId, role } = useAuth();
  const { theme } = useThemeContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local state as per requirements
  const [isSendingUserMessage, setIsSendingUserMessage] = useState(false);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  
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

  const sendMessage = async () => {
    const trimmedText = inputText.trim();
    
    // Step 1: If trimmed text is empty OR isWaitingForAI is true → do nothing
    if (!trimmedText || isWaitingForAI || !userId || !personId) {
      console.log('Send blocked:', { 
        emptyText: !trimmedText, 
        waitingForAI: isWaitingForAI,
      });
      return;
    }

    const messageContent = trimmedText;
    
    // Step 2: Set isSendingUserMessage = true
    setIsSendingUserMessage(true);

    try {
      console.log('Sending user message:', messageContent);

      // Step 3: Insert the user message into public.messages
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
        setIsSendingUserMessage(false);
        return;
      }

      console.log('User message inserted:', userMessage.id);
      
      // Step 4: Clear the input, show message immediately, scroll to bottom
      setInputText('');
      setMessages((prev) => [...prev, userMessage]);
      setTimeout(() => scrollToBottom(), 100);

      // Step 5: Set isSendingUserMessage = false and isWaitingForAI = true (show typing indicator)
      setIsSendingUserMessage(false);
      setIsWaitingForAI(true);

      // Step 6: Call generateAIReply with the last 10 messages
      const allMessages = [...messages, userMessage];
      const last10Messages = allMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const aiReplyText = await generateAIReply({
        user_id: userId,
        person_id: personId,
        person_name: personName || 'Unknown',
        relationship_type: relationshipType || 'unknown',
        messages: last10Messages,
      });

      console.log('AI reply generated:', aiReplyText);

      // Step 7: Insert AI message with sender = 'ai' (role = 'assistant')
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
        // Still insert fallback AI message locally
        const fallbackMessage: Message = {
          id: `fallback-${Date.now()}`,
          user_id: userId,
          person_id: personId,
          role: 'assistant',
          content: aiReplyText,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      } else {
        console.log('AI message inserted:', aiMessage.id);
        // Step 8: Hide typing indicator, add message, scroll to bottom
        setMessages((prev) => [...prev, aiMessage]);
      }

      setIsWaitingForAI(false);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      console.error('Unexpected error sending message:', err);
      // Step 9: If any error, still insert fallback AI message and do NOT crash
      const fallbackMessage: Message = {
        id: `fallback-${Date.now()}`,
        user_id: userId,
        person_id: personId,
        role: 'assistant',
        content: "I'm having trouble replying right now, but your feelings matter.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
      setIsSendingUserMessage(false);
      setIsWaitingForAI(false);
    }
  };

  // Send button should be disabled when:
  // - the input is empty OR only spaces
  // - an AI reply is currently pending
  const isSendDisabled = !inputText.trim() || isWaitingForAI || loading;

  return (
    <FullScreenSwipeHandler enabled={!isSendingUserMessage && !isWaitingForAI}>
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
                    isUser={message.role === 'user'}
                    timestamp={message.created_at}
                    animate={index === messages.length - 1}
                  />
                ))}
              </>
            )}

            {/* AI Typing Indicator - shown while isWaitingForAI is true */}
            {isWaitingForAI && <TypingIndicator />}
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
                editable={!isSendingUserMessage && !loading && !isWaitingForAI}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
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
