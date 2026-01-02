
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { useThemeContext } from '@/contexts/ThemeContext';
import { AIHeaderRow } from './AIHeaderRow';
import { format } from 'date-fns';

interface AnimatedChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  animate?: boolean;
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
}

export function AnimatedChatBubble({
  message,
  isUser,
  timestamp,
  animate = false,
  therapistName,
  therapistAvatarSource,
  therapistPersonaId,
}: AnimatedChatBubbleProps) {
  const { theme } = useThemeContext();
  const fadeAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animate ? 20 : 0)).current;
  const [hasAnimated, setHasAnimated] = useState(!animate);

  useEffect(() => {
    if (animate && !hasAnimated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setHasAnimated(true);
      });
    }
  }, [animate, hasAnimated, fadeAnim, slideAnim]);

  // Safely format timestamp with fallback
  let formattedTime = '';
  if (timestamp) {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        formattedTime = format(date, 'h:mm a');
      }
    } catch (error) {
      console.warn('[AnimatedChatBubble] Invalid timestamp:', timestamp, error);
    }
  }

  return (
    <View style={styles.container}>
      {!isUser && therapistName && therapistAvatarSource && (
        <AIHeaderRow
          therapistName={therapistName}
          therapistAvatarSource={therapistAvatarSource}
        />
      )}
      
      <Animated.View
        style={[
          styles.bubbleWrapper,
          isUser ? styles.userBubbleWrapper : styles.aiBubbleWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {!isUser && therapistAvatarSource && (
          <Image
            source={therapistAvatarSource}
            style={styles.avatarIcon}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
          />
        )}
        
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: theme.primary }
              : { backgroundColor: theme.card },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#FFFFFF' : theme.textPrimary },
            ]}
          >
            {message}
          </Text>
          {formattedTime && (
            <Text
              style={[
                styles.timestamp,
                { color: isUser ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary },
              ]}
            >
              {formattedTime}
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  userBubbleWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  aiBubbleWrapper: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  avatarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
});
