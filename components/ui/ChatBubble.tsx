
import React from 'react';
import { ImageSourcePropType } from 'react-native';
import { AnimatedChatBubble } from './AnimatedChatBubble';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  animate?: boolean;
  // Therapist metadata for AI messages
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
}

/**
 * ChatBubble - Backward compatibility wrapper
 * 
 * This component now wraps AnimatedChatBubble to provide
 * backward compatibility for existing code while adding
 * subtle animations that respect reduced motion settings.
 */
export function ChatBubble({ 
  message, 
  isUser, 
  timestamp, 
  animate = false,
  therapistName,
  therapistAvatarSource,
  therapistPersonaId,
}: ChatBubbleProps) {
  return (
    <AnimatedChatBubble
      message={message}
      isUser={isUser}
      timestamp={timestamp}
      animate={animate}
      therapistName={therapistName}
      therapistAvatarSource={therapistAvatarSource}
      therapistPersonaId={therapistPersonaId}
    />
  );
}
