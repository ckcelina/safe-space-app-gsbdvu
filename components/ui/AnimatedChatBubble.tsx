
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, ImageSourcePropType } from 'react-native';
import { safeFormatDate } from '@/utils/dateHelpers';

interface AnimatedChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string | number | Date | null | undefined;
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  animate?: boolean;
  therapistPersonaId?: string;
}

export const AnimatedChatBubble: React.FC<AnimatedChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
  therapistName,
  therapistAvatarSource,
  animate = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animate ? 20 : 0)).current;

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
    }
  }, [animate, fadeAnim, slideAnim]);

  // Safely format timestamp with fallback
  const formattedTime = safeFormatDate(timestamp, 'h:mm a', '');

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.therapistContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {!isUser && therapistAvatarSource && (
        <Image source={therapistAvatarSource} style={styles.avatar} />
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.therapistBubble]}>
        {!isUser && therapistName && (
          <Text style={styles.therapistName}>{therapistName}</Text>
        )}
        <Text style={[styles.messageText, isUser ? styles.userText : styles.therapistText]}>
          {message}
        </Text>
        {formattedTime && (
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.therapistTimestamp]}>
            {formattedTime}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  therapistContainer: {
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
  userBubble: {
    backgroundColor: '#007AFF',
  },
  therapistBubble: {
    backgroundColor: '#E5E5EA',
  },
  therapistName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  therapistText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  therapistTimestamp: {
    color: '#999',
  },
});
