
import React from 'react';
import { ImageSourcePropType } from 'react-native';
import { AnimatedTypingIndicator } from './AnimatedTypingIndicator';

interface TypingIndicatorProps {
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
}

/**
 * TypingIndicator - Backward compatibility wrapper
 * 
 * This component now wraps AnimatedTypingIndicator to provide
 * backward compatibility for existing code while adding
 * subtle animations that respect reduced motion settings.
 */
export function TypingIndicator({ 
  therapistAvatarSource,
  therapistPersonaId,
}: TypingIndicatorProps = {}) {
  return (
    <AnimatedTypingIndicator
      therapistAvatarSource={therapistAvatarSource}
      therapistPersonaId={therapistPersonaId}
    />
  );
}
