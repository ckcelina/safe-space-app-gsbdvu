
import React from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { AnimatedChatBubble } from '@/components/ui/AnimatedChatBubble';
import { format, isToday, isYesterday } from 'date-fns';
import type { Message } from '@/types/database.types';

interface ExtendedMessage extends Message {
  therapist_name?: string;
  therapist_avatar_source?: any;
  failed_to_send?: boolean;
  retry_content?: string;
  optimistic?: boolean;
  temp_id?: string;
}

type MessageListItem =
  | { type: 'date-separator'; label: string; id: string }
  | { type: 'message'; message: ExtendedMessage };

interface ChatUIProps {
  messages: ExtendedMessage[];
  theme: any;
  onRetry?: (message: ExtendedMessage) => void;
}

/**
 * Format a date for the date separator
 */
function formatDateSeparator(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMMM d, yyyy');
}

/**
 * Group messages by date and add date separators
 */
function groupMessagesByDate(messages: ExtendedMessage[]): MessageListItem[] {
  const items: MessageListItem[] = [];
  let lastDate: string | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.created_at);
    const dateKey = format(messageDate, 'yyyy-MM-dd');

    if (dateKey !== lastDate) {
      items.push({
        type: 'date-separator',
        label: formatDateSeparator(messageDate),
        id: `date-${dateKey}`,
      });
      lastDate = dateKey;
    }

    items.push({
      type: 'message',
      message,
    });
  });

  return items;
}

/**
 * Reusable Chat UI component
 * 
 * Displays a list of messages with date separators and handles
 * optimistic UI for messages that are being sent.
 */
export function ChatUI({ messages, theme, onRetry }: ChatUIProps) {
  const messageItems = React.useMemo(
    () => groupMessagesByDate(messages),
    [messages]
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<MessageListItem>) => {
    if (item.type === 'date-separator') {
      return (
        <View style={styles.dateSeparatorContainer}>
          <View style={[styles.dateSeparator, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dateSeparatorText, { color: theme.colors.textSecondary }]}>
            {item.label}
          </Text>
          <View style={[styles.dateSeparator, { backgroundColor: theme.colors.border }]} />
        </View>
      );
    }

    const message = item.message;
    const isUser = message.role === 'user';

    return (
      <AnimatedChatBubble
        message={message.content}
        isUser={isUser}
        timestamp={message.created_at}
        theme={theme}
        index={index}
        therapistName={message.therapist_name}
        therapistAvatarSource={message.therapist_avatar_source}
        failed={message.failed_to_send}
        optimistic={message.optimistic}
        onRetry={message.failed_to_send && onRetry ? () => onRetry(message) : undefined}
      />
    );
  };

  return (
    <FlatList
      data={messageItems}
      keyExtractor={(item) => item.id || (item.type === 'message' ? item.message.id : '')}
      renderItem={renderItem}
      contentContainerStyle={styles.messageList}
      inverted={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparator: {
    flex: 1,
    height: 1,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
});
