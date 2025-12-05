
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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

export default function ChatScreen() {
  const { personId, personName } = useLocalSearchParams<{
    personId: string;
    personName: string;
  }>();
  const { userId } = useAuth();
  const { colors } = useThemeContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchMessages = useCallback(async () => {
    try {
      console.log('Fetching messages for person:', personId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .eq('person_id', personId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        console.log('Messages loaded:', data?.length);
        setMessages(data || []);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Unexpected error fetching messages:', error);
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

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      console.log('Sending user message:', messageContent);

      // Insert user message
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
        setSending(false);
        return;
      }

      console.log('User message inserted:', userMessage);
      setMessages((prev) => [...prev, userMessage]);
      setTimeout(() => scrollToBottom(), 100);

      console.log('Calling AI Edge Function...');

      // Call Supabase Edge Function
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
        'generate-ai-response',
        {
          body: {
            user_id: userId,
            person_id: personId,
          },
        }
      );

      if (aiError) {
        console.error('Error calling AI function:', aiError);
        const fallbackMessage = {
          user_id: userId,
          person_id: personId,
          role: 'assistant' as const,
          content:
            'I apologize, but I am having trouble responding right now. Please try again.',
        };

        const { data: fallbackData } = await supabase
          .from('messages')
          .insert([fallbackMessage])
          .select()
          .single();

        if (fallbackData) {
          setMessages((prev) => [...prev, fallbackData]);
          setTimeout(() => scrollToBottom(), 100);
        }
      } else {
        console.log('AI response received:', aiResponse);

        // Insert AI message
        const { data: aiMessage, error: aiInsertError } = await supabase
          .from('messages')
          .insert([
            {
              user_id: userId,
              person_id: personId,
              role: 'assistant',
              content: aiResponse.reply || 'I understand. Tell me more.',
            },
          ])
          .select()
          .single();

        if (aiInsertError) {
          console.error('Error inserting AI message:', aiInsertError);
        } else {
          console.log('AI message inserted:', aiMessage);
          setMessages((prev) => [...prev, aiMessage]);
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    } catch (error) {
      console.error('Unexpected error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{personName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.highlight }]}>
                <IconSymbol
                  ios_icon_name="bubble.left.and.bubble.right.fill"
                  android_material_icon_name="chat"
                  size={40}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Start the conversation
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
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

          {/* Typing Indicator */}
          {sending && <TypingIndicator />}
        </ScrollView>
      )}

      {/* Input Bar */}
      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  inputWrapper: {
    flex: 1,
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
    opacity: 0.5,
  },
});
