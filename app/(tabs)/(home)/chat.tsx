
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
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

export default function ChatScreen() {
  const { personId, personName } = useLocalSearchParams<{ personId: string; personName: string }>();
  const { userId } = useAuth();
  const { colors } = useThemeContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

      console.log('Calling AI Edge Function...');
      
      // Call Supabase Edge Function
      // The function will fetch the last 15 messages from the database for context
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
        // Insert a fallback message
        const fallbackMessage = {
          user_id: userId,
          person_id: personId,
          role: 'assistant' as const,
          content: 'I apologize, but I am having trouble responding right now. Please try again.',
        };
        
        const { data: fallbackData } = await supabase
          .from('messages')
          .insert([fallbackMessage])
          .select()
          .single();
        
        if (fallbackData) {
          setMessages((prev) => [...prev, fallbackData]);
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
        }
      }
    } catch (error) {
      console.error('Unexpected error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isUser ? '#FFFFFF' : colors.text },
          ]}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {personName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
        />
      )}

      {sending && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.typingText, { color: colors.textSecondary }]}>
            AI is typing...
          </Text>
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  backButton: {
    padding: 8,
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
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
