
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { safeParseDate, safeFormatDate } from '@/utils/dateHelpers';

interface AnimatedChatBubbleProps {
  content: string;
  sender: 'user' | 'ai';
  timestamp?: string | number | Date | null | undefined;
  theme?: any;
}

export const AnimatedChatBubble: React.FC<AnimatedChatBubbleProps> = ({
  content,
  sender,
  timestamp,
  theme,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Safely parse and format the timestamp
  // If timestamp is invalid, formattedTime will be an empty string
  const formattedTime = safeFormatDate(timestamp, 'h:mm a', '');

  const isUser = sender === 'user';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          theme && {
            backgroundColor: isUser ? theme.primary : theme.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.content,
            isUser ? styles.userText : styles.aiText,
          ]}
        >
          {content}
        </Text>
        {formattedTime && (
          <Text style={styles.timestamp}>{formattedTime}</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  aiBubble: {
    backgroundColor: '#F0F0F0',
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
});
