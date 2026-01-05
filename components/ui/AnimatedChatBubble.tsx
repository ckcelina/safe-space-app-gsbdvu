
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, ImageSourcePropType } from 'react-native';
import { format } from 'date-fns';
import { useThemeContext } from '@/contexts/ThemeContext';

interface AnimatedChatBubbleProps {
  message: {
    sender: 'user' | 'ai';
    content: string;
    timestamp?: string | number | Date | null;
    therapist_name?: string;
    therapist_avatar_source?: ImageSourcePropType;
  };
  index: number;
}

/**
 * Safe timestamp normalization helper
 * Accepts: string | number | Date | null | undefined
 * Returns: valid Date or null
 */
const normalizeTimestamp = (timestamp: string | number | Date | null | undefined): Date | null => {
  if (!timestamp) return null;

  let date: Date;
  
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return null;
  }

  // Validate the date
  return isNaN(date.getTime()) ? null : date;
};

export const AnimatedChatBubble: React.FC<AnimatedChatBubbleProps> = ({ message, index }) => {
  const { theme } = useThemeContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isUser = message.sender === 'user';
  
  // Safe timestamp formatting
  const normalizedTimestamp = normalizeTimestamp(message.timestamp);
  const formattedTime = normalizedTimestamp ? format(normalizedTimestamp, 'p') : '';

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {!isUser && message.therapist_avatar_source && (
        <Image
          source={message.therapist_avatar_source}
          style={styles.avatar}
        />
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.colors.primary }
            : { backgroundColor: theme.colors.surface },
        ]}
      >
        {!isUser && message.therapist_name && (
          <Text style={[styles.therapistName, { color: theme.colors.primary }]}>
            {message.therapist_name}
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            { color: isUser ? '#FFFFFF' : theme.colors.text },
          ]}
        >
          {message.content}
        </Text>
        {formattedTime && (
          <Text
            style={[
              styles.timestamp,
              { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
            ]}
          >
            {formattedTime}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  therapistName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
});
