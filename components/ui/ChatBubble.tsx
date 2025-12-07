
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  animate?: boolean;
}

export function ChatBubble({ message, isUser, timestamp, animate = false }: ChatBubbleProps) {
  const { theme } = useThemeContext();
  const fadeAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animate ? 15 : 0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animate) {
      // Subtle fade-in + slide-up animation on appear
      const animation = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
      
      animationRef.current = animation;
      animation.start();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [fadeAnim, slideAnim, animate]);

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    
    try {
      const date = new Date(ts);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMs / 3600000);
      const diffInDays = Math.floor(diffInMs / 86400000);

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('[ChatBubble] Error formatting timestamp:', error);
      return '';
    }
  };

  const renderMessageText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let keyCounter = 0;

    while (currentIndex < text.length) {
      // Look for ** or *
      const doubleAsteriskIndex = text.indexOf('**', currentIndex);
      const singleAsteriskIndex = text.indexOf('*', currentIndex);

      // Determine which comes first
      let nextAsteriskIndex = -1;
      let isDouble = false;

      if (doubleAsteriskIndex !== -1 && (singleAsteriskIndex === -1 || doubleAsteriskIndex < singleAsteriskIndex)) {
        nextAsteriskIndex = doubleAsteriskIndex;
        isDouble = true;
      } else if (singleAsteriskIndex !== -1) {
        nextAsteriskIndex = singleAsteriskIndex;
        isDouble = false;
      }

      // If no asterisk found, add the rest of the text
      if (nextAsteriskIndex === -1) {
        const remainingText = text.substring(currentIndex);
        if (remainingText) {
          parts.push(<Text key={keyCounter++}>{remainingText}</Text>);
        }
        break;
      }

      // Add text before the asterisk
      if (nextAsteriskIndex > currentIndex) {
        const beforeText = text.substring(currentIndex, nextAsteriskIndex);
        parts.push(<Text key={keyCounter++}>{beforeText}</Text>);
      }

      // Find the closing asterisk
      const asteriskLength = isDouble ? 2 : 1;
      const searchStart = nextAsteriskIndex + asteriskLength;
      let closingIndex = -1;

      if (isDouble) {
        closingIndex = text.indexOf('**', searchStart);
      } else {
        closingIndex = text.indexOf('*', searchStart);
      }

      // If closing asterisk found, render bold text
      if (closingIndex !== -1) {
        const boldText = text.substring(searchStart, closingIndex);
        parts.push(
          <Text key={keyCounter++} style={{ fontWeight: '700' }}>
            {boldText}
          </Text>
        );
        currentIndex = closingIndex + asteriskLength;
      } else {
        // No closing asterisk, treat as regular text
        const asteriskText = isDouble ? '**' : '*';
        parts.push(<Text key={keyCounter++}>{asteriskText}</Text>);
        currentIndex = searchStart;
      }
    }

    return parts;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {!isUser && (
        <View style={[styles.aiIcon, { backgroundColor: theme.background }]}>
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto_awesome"
            size={16}
            color={theme.primary}
          />
        </View>
      )}

      <View style={styles.bubbleContainer}>
        {isUser ? (
          <LinearGradient
            colors={theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.userBubble]}
          >
            <Text style={[styles.userText, { color: theme.buttonText }]}>{message}</Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.bubble,
              styles.aiBubble,
              {
                backgroundColor: theme.card,
              },
            ]}
          >
            <Text style={[styles.aiText, { color: theme.textPrimary }]}>
              {renderMessageText(message)}
            </Text>
          </View>
        )}

        {timestamp && (
          <Text
            style={[
              styles.timestamp,
              { color: theme.textSecondary },
              isUser ? styles.timestampRight : styles.timestampLeft,
            ]}
          >
            {formatTimestamp(timestamp)}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
    elevation: 2,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    backgroundColor: '#F5F5F5',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  userText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: 4,
  },
  timestampLeft: {
    textAlign: 'left',
    marginLeft: 4,
  },
});
