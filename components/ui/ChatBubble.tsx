
import React from 'react';
import { ImageSourcePropType } from 'react-native';
import { AnimatedChatBubble } from './AnimatedChatBubble';

interface ChatBubbleProps {
  message?: string;
  isUser: boolean;
  timestamp?: string;
  animate?: boolean;
  // Therapist metadata for AI messages
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
  // Legacy props for backward compatibility
  sender?: 'user' | 'ai' | 'assistant';
  content?: string;
  createdAt?: string;
}

/**
 * ChatBubble - Backward compatibility wrapper
 * 
 * This component now wraps AnimatedChatBubble to provide
 * backward compatibility for existing code while adding
 * subtle animations that respect reduced motion settings.
 * 
 * Now includes WhatsApp-like timestamps inside bubbles.
 */
export function ChatBubble({ 
  message, 
  isUser, 
  timestamp, 
  animate = false,
  therapistName,
  therapistAvatarSource,
  therapistPersonaId,
  // Legacy props
  sender,
  content,
  createdAt,
}: ChatBubbleProps) {
  // Handle legacy props
  const finalMessage = message || content || '';
  const finalIsUser = sender ? (sender === 'user') : isUser;
  const finalTimestamp = timestamp || createdAt;
  
  return (
    <AnimatedChatBubble
      message={finalMessage}
      isUser={finalIsUser}
      timestamp={finalTimestamp}
      animate={animate}
      therapistName={therapistName}
      therapistAvatarSource={therapistAvatarSource}
      therapistPersonaId={therapistPersonaId}
    />
  );
}
