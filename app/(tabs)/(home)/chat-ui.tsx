
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { ChatBubble } from '@/components/ui/ChatBubble';

interface ChatScreenUIProps {
  personId: string;
  personName: string;
  relationshipType?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  createdAt: string;
}

// Mock hook - replace with actual implementation
function useChatMessages(personId: string): Message[] {
  // This is a placeholder that returns an empty array
  // In the real implementation, this would fetch messages from Supabase
  console.log('useChatMessages called with personId:', personId);
  return [];
}

export default function ChatScreenUI({
  personId,
  personName,
  relationshipType,
}: ChatScreenUIProps) {
  const { theme } = useThemeContext();
  const flatListRef = useRef<FlatList>(null);
  
  // Get messages from the hook (currently returns empty array)
  const messages = useChatMessages(personId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Small delay to ensure the list has rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    return (
      <ChatBubble
        sender={item.sender}
        content={item.content}
        createdAt={item.createdAt}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
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
        Share what&apos;s on your mind about {personName}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
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
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {personName}
            </Text>
            {relationshipType && (
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {relationshipType}
              </Text>
            )}
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.messagesContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.background }]}>
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="Type your message..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={1000}
              editable={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            disabled={true}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerRight: {
    width: 40,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  messagesContentEmpty: {
    flexGrow: 1,
  },
  emptyState: {
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
    opacity: 0.5,
  },
});
