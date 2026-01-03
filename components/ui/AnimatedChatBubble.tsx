
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, ImageSourcePropType, Platform } from 'react-native';
import { safeParseDate, safeFormatDate } from '@/utils/dateHelpers';
import { useThemeContext } from '@/contexts/ThemeContext';

interface AnimatedChatBubbleProps {
  message?: string;
  content?: string;
  isUser: boolean;
  timestamp?: string | number | Date | null | undefined;
  animate?: boolean;
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
  // Legacy props for backward compatibility
  sender?: 'user' | 'ai' | 'assistant';
  createdAt?: string;
}

export const AnimatedChatBubble: React.FC<AnimatedChatBubbleProps> = ({
  message,
  content,
  isUser,
  timestamp,
  animate = false,
  therapistName,
  therapistAvatarSource,
  therapistPersonaId,
  // Legacy props
  sender,
  createdAt,
}) => {
  const { theme } = useThemeContext();
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

  // Handle legacy props
  const finalMessage = message || content || '';
  const finalIsUser = sender ? (sender === 'user') : isUser;
  const finalTimestamp = timestamp || createdAt;

  // Safely parse and format the timestamp
  const formattedTime = safeFormatDate(finalTimestamp, 'h:mm a', '');

  // Show avatar only for AI messages (not user messages)
  const showAvatar = !finalIsUser && therapistAvatarSource;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignSelf: finalIsUser ? 'flex-end' : 'flex-start',
          flexDirection: finalIsUser ? 'row-reverse' : 'row',
        },
      ]}
    >
      {/* Avatar - only shown for AI messages, only once per message */}
      {showAvatar && (
        <View style={styles.avatarContainer}>
          <Image
            source={therapistAvatarSource}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Message bubble */}
      <View
        style={[
          styles.bubble,
          finalIsUser ? styles.userBubble : styles.aiBubble,
          {
            backgroundColor: finalIsUser ? theme.primary : theme.card,
            maxWidth: showAvatar ? '75%' : '80%',
          },
        ]}
      >
        <Text
          style={[
            styles.content,
            finalIsUser ? styles.userText : styles.aiText,
            { color: finalIsUser ? '#FFFFFF' : theme.textPrimary },
          ]}
        >
          {finalMessage}
        </Text>
        {formattedTime && (
          <Text 
            style={[
              styles.timestamp,
              { color: finalIsUser ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary }
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
  container: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
    overflow: 'hidden',
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
      default: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  avatar: {
    width: 32,
    height: 32,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      default: {
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
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
    opacity: 0.8,
  },
});
