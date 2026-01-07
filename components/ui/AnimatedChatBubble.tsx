
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { format } from 'date-fns';

interface AnimatedChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string | number | Date | null | undefined;
  theme: any;
  index: number;
  therapistName?: string;
  failed?: boolean;
}

/**
 * Converts various timestamp formats to a valid Date or returns null
 */
function toValidDate(value: any): Date | null {
  if (!value) return null;
  
  let date: Date | null = null;

  if (typeof value === 'number') {
    date = new Date(value);
  } else if (typeof value === 'string') {
    try {
      date = new Date(value);
    } catch {
      return null;
    }
  } else if (value instanceof Date) {
    date = value;
  }

  if (date && !isNaN(date.getTime())) {
    return date;
  }

  return null;
}

export const AnimatedChatBubble: React.FC<AnimatedChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
  theme,
  index,
  therapistName,
  failed = false,
}) => {
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
  }, [index]);

  const validDate = toValidDate(timestamp);
  const formattedTime = validDate ? format(validDate, 'h:mm a') : 'Now';

  return (
    <Animated.View
      style={[
        styles.bubbleContainer,
        isUser ? styles.userBubbleContainer : styles.aiBubbleContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {!isUser && therapistName && (
        <Text style={[styles.therapistName, { color: theme.colors.textSecondary }]}>
          {therapistName}
        </Text>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.colors.primary }]
            : [styles.aiBubble, { backgroundColor: theme.colors.card }],
          failed && styles.failedBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser
              ? [styles.userMessageText, { color: '#FFFFFF' }]
              : [styles.aiMessageText, { color: theme.colors.text }],
          ]}
        >
          {message}
        </Text>
        <Text
          style={[
            styles.timestamp,
            isUser
              ? [styles.userTimestamp, { color: 'rgba(255, 255, 255, 0.7)' }]
              : [styles.aiTimestamp, { color: theme.colors.textSecondary }],
          ]}
        >
          {formattedTime}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
  },
  aiBubbleContainer: {
    alignItems: 'flex-start',
  },
  therapistName: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 12,
    fontWeight: '500',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  failedBubble: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {},
  aiMessageText: {},
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {},
  aiTimestamp: {},
});
