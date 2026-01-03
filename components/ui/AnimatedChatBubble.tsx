
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ImageSourcePropType, Image } from 'react-native';
import { format, isValid } from 'date-fns';
import { useThemeContext } from '@/contexts/ThemeContext';

interface AnimatedChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string | number | Date | null | undefined;
  animate?: boolean;
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
}

export const AnimatedChatBubble: React.FC<AnimatedChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
  animate = false,
  therapistName,
  therapistAvatarSource,
}) => {
  const { theme } = useThemeContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (animate) {
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
    } else {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [fadeAnim, slideAnim, animate]);

  // Safe timestamp parsing - handles null, undefined, invalid strings, etc.
  const parseTimestamp = (ts: string | number | Date | null | undefined): Date | null => {
    if (!ts) {
      return null;
    }
    
    try {
      const date = new Date(ts);
      // Use date-fns isValid to check if the date is actually valid
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  const parsedDate = parseTimestamp(timestamp);
  const formattedTime = parsedDate ? format(parsedDate, 'h:mm a') : '';

  return (
    <Animated.View
      style={[
        styles.bubbleContainer,
        isUser ? styles.userBubbleContainer : styles.therapistBubbleContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {!isUser && therapistAvatarSource && (
        <Image source={therapistAvatarSource} style={styles.avatar} />
      )}
      <View
        style={[
          styles.bubble,
          isUser ? { backgroundColor: theme.primary } : { backgroundColor: theme.cardBackground },
        ]}
      >
        {!isUser && therapistName && (
          <Text style={[styles.therapistName, { color: theme.primary }]}>
            {therapistName}
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            { color: isUser ? '#FFFFFF' : theme.text },
          ]}
        >
          {message}
        </Text>
        {formattedTime && (
          <Text
            style={[
              styles.timestamp,
              { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
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
  bubbleContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userBubbleContainer: {
    justifyContent: 'flex-end',
  },
  therapistBubbleContainer: {
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
