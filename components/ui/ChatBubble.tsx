
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

  useEffect(() => {
    if (animate) {
      // Subtle fade-in + slide-up animation on appear
      Animated.parallel([
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
      ]).start();
    }
  }, [fadeAnim, slideAnim, animate]);

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    
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
            <Text style={[styles.aiText, { color: theme.textPrimary }]}>{message}</Text>
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
