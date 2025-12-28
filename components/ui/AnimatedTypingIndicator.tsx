
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, ImageSourcePropType } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedTypingIndicatorProps {
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
}

/**
 * Get pulse animation parameters based on therapist personality
 * - Calm personas: Slower, gentler pulse
 * - Direct personas: Faster, more noticeable pulse
 */
function getPulseParamsForPersona(personaId?: string): { duration: number; scale: number } {
  if (!personaId) {
    return { duration: 1500, scale: 1.08 }; // Default
  }

  // Calm, slow-paced personas (Dr. Elias, Claire, Ruth)
  if (['dr_elias', 'claire', 'ruth'].includes(personaId)) {
    return { duration: 2000, scale: 1.06 }; // Slower, gentler
  }

  // Direct, rapid-paced personas (Noah, Jordan)
  if (['noah', 'jordan'].includes(personaId)) {
    return { duration: 1200, scale: 1.1 }; // Faster, more noticeable
  }

  // Balanced personas (Maya, Aisha, Ken)
  return { duration: 1500, scale: 1.08 }; // Standard
}

export function AnimatedTypingIndicator({ 
  therapistAvatarSource,
  therapistPersonaId,
}: AnimatedTypingIndicatorProps) {
  const { theme } = useThemeContext();
  const isReducedMotion = useReducedMotion();
  
  // Dot animations
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  
  // Avatar pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isReducedMotion) {
      // No animations if reduced motion is enabled
      return;
    }

    // Dot animations (subtle bounce)
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -6,
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dotAnimation = Animated.parallel([
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 150),
      createDotAnimation(dot3Anim, 300),
    ]);

    animationRef.current = dotAnimation;
    dotAnimation.start();

    // Avatar pulse animation (breathing effect)
    const pulseParams = getPulseParamsForPersona(therapistPersonaId);
    
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: pulseParams.scale,
          duration: pulseParams.duration,
          easing: Easing.bezier(0.4, 0, 0.6, 1), // Smooth, breathing-like
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: pulseParams.duration,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimationRef.current = pulseAnimation;
    pulseAnimation.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
      }
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
      pulseAnim.setValue(1);
    };
  }, [dot1Anim, dot2Anim, dot3Anim, pulseAnim, isReducedMotion, therapistPersonaId]);

  return (
    <View style={styles.container}>
      {/* Animated Avatar with pulse effect */}
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            transform: [{ scale: isReducedMotion ? 1 : pulseAnim }],
          },
        ]}
      >
        {therapistAvatarSource ? (
          <Image
            source={therapistAvatarSource}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.aiIcon, { backgroundColor: theme.background }]}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto_awesome"
              size={16}
              color={theme.primary}
            />
          </View>
        )}
      </Animated.View>

      {/* Typing dots */}
      <View style={[styles.bubble, { backgroundColor: theme.card }]}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: theme.textSecondary,
                transform: [{ translateY: isReducedMotion ? 0 : dot1Anim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: theme.textSecondary,
                transform: [{ translateY: isReducedMotion ? 0 : dot2Anim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: theme.textSecondary,
                transform: [{ translateY: isReducedMotion ? 0 : dot3Anim }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
