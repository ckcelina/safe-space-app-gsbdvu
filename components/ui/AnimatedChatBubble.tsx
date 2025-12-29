
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ImageSourcePropType, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/contexts/ThemeContext';
import { AIHeaderRow } from './AIHeaderRow';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { format } from 'date-fns';

interface AnimatedChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  animate?: boolean;
  // Therapist metadata for AI messages
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string; // Used to determine easing curve
}

/**
 * Get easing function based on therapist personality
 * - Soft personalities (Dr. Elias, Maya, Ruth): Gentle, smooth easing
 * - Snappy personalities (Noah, Jordan): Quick, responsive easing
 * - Balanced personalities (Claire, Aisha, Ken): Standard easing
 */
function getEasingForPersona(personaId?: string): (value: number) => number {
  if (!personaId) {
    return Easing.out(Easing.cubic); // Default
  }

  // Soft, calming personas
  if (['dr_elias', 'maya', 'ruth'].includes(personaId)) {
    return Easing.bezier(0.25, 0.1, 0.25, 1); // Gentle, smooth
  }

  // Snappy, direct personas
  if (['noah', 'jordan'].includes(personaId)) {
    return Easing.bezier(0.4, 0, 0.2, 1); // Quick, responsive
  }

  // Balanced personas
  return Easing.out(Easing.cubic); // Standard
}

/**
 * Get animation duration based on therapist personality
 * - Slow pacing: 250ms
 * - Steady pacing: 200ms
 * - Rapid pacing: 150ms
 */
function getDurationForPersona(personaId?: string): number {
  if (!personaId) {
    return 200; // Default
  }

  // Slow pacing (Dr. Elias, Claire, Ruth)
  if (['dr_elias', 'claire', 'ruth'].includes(personaId)) {
    return 250;
  }

  // Rapid pacing (Noah, Jordan)
  if (['noah', 'jordan'].includes(personaId)) {
    return 150;
  }

  // Steady pacing (Maya, Aisha, Ken)
  return 200;
}

/**
 * Get initials from therapist name for avatar placeholder
 */
function getInitials(name?: string): string {
  if (!name) return 'SS'; // Safe Space default
  
  const parts = name.trim().split(' ');
  if (parts.length === 0) return 'SS';
  
  if (parts.length === 1) {
    // Single name - take first two letters
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  // Multiple names - take first letter of first two parts
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Format timestamp for display inside bubble
 * Returns time in "h:mm a" format (e.g., "7:44 PM")
 */
function formatMessageTime(timestamp?: string): string {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    // Format as "7:44 PM" using device locale
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('[AnimatedChatBubble] Error formatting message time:', error);
    return '';
  }
}

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE: Memoized component to prevent unnecessary re-renders
// ═══════════════════════════════════════════════════════════════════
export const AnimatedChatBubble = React.memo(({ 
  message, 
  isUser, 
  timestamp, 
  animate = false,
  therapistName,
  therapistAvatarSource,
  therapistPersonaId,
}: AnimatedChatBubbleProps) => {
  const { theme } = useThemeContext();
  const isReducedMotion = useReducedMotion();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(animate && !isReducedMotion ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animate && !isReducedMotion ? 10 : 0)).current;
  
  // NEW: Subtle glow effect for completion cue
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Only animate AI messages, and only if reduced motion is disabled
    if (animate && !isUser && !isReducedMotion) {
      const easing = getEasingForPersona(therapistPersonaId);
      const duration = getDurationForPersona(therapistPersonaId);

      const animation = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        }),
      ]);
      
      animationRef.current = animation;
      animation.start(() => {
        // After entrance animation completes, trigger subtle completion glow
        if (!isReducedMotion) {
          const glowAnimation = Animated.sequence([
            // Gentle fade in
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 400,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            // Hold briefly
            Animated.delay(200),
            // Gentle fade out
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 600,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ]);
          
          glowAnimationRef.current = glowAnimation;
          glowAnimation.start();
        }
      });
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (glowAnimationRef.current) {
        glowAnimationRef.current.stop();
      }
    };
  }, [fadeAnim, slideAnim, glowAnim, animate, isUser, isReducedMotion, therapistPersonaId]);

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

  // Calculate glow opacity (very subtle)
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15], // Very subtle glow
  });

  // Format the timestamp for display
  const formattedTime = formatMessageTime(timestamp);

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* AI Header Row - only for AI messages */}
      {!isUser && (
        <AIHeaderRow 
          therapistName={therapistName}
          therapistAvatarSource={therapistAvatarSource}
        />
      )}

      <View
        style={[
          styles.container,
          isUser ? styles.userContainer : styles.aiContainer,
        ]}
      >
        {!isUser && (
          <View style={[styles.aiIcon, { backgroundColor: theme.background }]}>
            {therapistAvatarSource ? (
              <Image
                source={therapistAvatarSource}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarInitials}>
                  {getInitials(therapistName)}
                </Text>
              </View>
            )}
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
              {/* NEW: Timestamp inside bubble */}
              {formattedTime && (
                <Text style={[styles.timestampInBubble, styles.timestampInBubbleUser]}>
                  {formattedTime}
                </Text>
              )}
            </LinearGradient>
          ) : (
            <View style={styles.aiBubbleWrapper}>
              {/* Subtle glow layer - only for AI messages with animation */}
              {animate && !isReducedMotion && (
                <Animated.View
                  style={[
                    styles.glowLayer,
                    {
                      backgroundColor: theme.primary,
                      opacity: glowOpacity,
                    },
                  ]}
                  pointerEvents="none"
                />
              )}
              
              {/* Main bubble */}
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
                {/* NEW: Timestamp inside bubble */}
                {formattedTime && (
                  <Text style={[styles.timestampInBubble, styles.timestampInBubbleAI, { color: theme.textSecondary }]}>
                    {formattedTime}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE: Custom comparison function for React.memo
  // Only re-render if these specific props change
  // ═══════════════════════════════════════════════════════════════════
  return (
    prevProps.message === nextProps.message &&
    prevProps.isUser === nextProps.isUser &&
    prevProps.timestamp === nextProps.timestamp &&
    prevProps.animate === nextProps.animate &&
    prevProps.therapistName === nextProps.therapistName &&
    prevProps.therapistAvatarSource === nextProps.therapistAvatarSource &&
    prevProps.therapistPersonaId === nextProps.therapistPersonaId
  );
});

AnimatedChatBubble.displayName = 'AnimatedChatBubble';

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  aiBubbleWrapper: {
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 20,
    zIndex: -1,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  aiText: {
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  // NEW: Timestamp inside bubble styles
  timestampInBubble: {
    fontSize: 11,
    marginTop: 6,
    opacity: 0.7,
  },
  timestampInBubbleUser: {
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'right',
  },
  timestampInBubbleAI: {
    textAlign: 'left',
  },
});
