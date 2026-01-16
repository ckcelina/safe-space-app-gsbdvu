
import React, { ReactNode } from 'react';
import { View, StyleSheet, Text, ImageSourcePropType } from 'react-native';

interface AnimatedChatBubbleProps {
  message?: string;
  isUser?: boolean;
  timestamp?: string;
  animate?: boolean;
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
  // Support children as fallback
  children?: ReactNode;
}

export function AnimatedChatBubble({ 
  message, 
  isUser = false, 
  timestamp,
  children 
}: AnimatedChatBubbleProps) {
  // If children provided, render them (for backward compatibility)
  if (children) {
    return <View style={styles.container}>{children}</View>;
  }
  
  // Otherwise render message
  return (
    <View style={[styles.container, isUser ? styles.userBubble : styles.aiBubble]}>
      {message && <Text style={isUser ? styles.userText : styles.aiText}>{message}</Text>}
      {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  aiText: {
    color: '#000000',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
  },
});
