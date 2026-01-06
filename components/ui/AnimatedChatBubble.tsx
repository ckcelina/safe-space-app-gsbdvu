import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { format } from 'date-fns';

interface AnimatedChatBubbleProps {
  message: string;
  sender: 'user' | 'ai';
  timestamp: string | number | Date | null | undefined;
  theme: any;
}

// Safe timestamp normalization
function normalizeTimestamp(timestamp: string | number | Date | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return null;
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch {
    return null;
  }
}

export function AnimatedChatBubble({ message, sender, timestamp, theme }: AnimatedChatBubbleProps) {
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

  // Safe timestamp formatting
  const safeDate = normalizeTimestamp(timestamp);
  const formattedTime = safeDate ? format(safeDate, 'p') : '';

  const isUser = sender === 'user';

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.colors.primary }
            : { backgroundColor: theme.colors.card },
        ]}
      >
        <Text
          style={[
            styles.message,
            { color: isUser ? '#FFFFFF' : theme.colors.text },
          ]}
        >
          {message}
        </Text>
        {formattedTime && (
          <Text
            style={[
              styles.timestamp,
              { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.text + '80' },
            ]}
          >
            {formattedTime}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
});
