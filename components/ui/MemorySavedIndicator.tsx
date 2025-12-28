
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MemorySavedIndicatorProps {
  visible: boolean;
  onHide?: () => void;
}

/**
 * Subtle, calming indicator that appears briefly when memories are saved.
 * 
 * RULES:
 * - No raw data or internal IDs
 * - No medical or diagnostic information
 * - Minimal and calm UI
 * - Respects reduced motion settings
 */
export function MemorySavedIndicator({ visible, onHide }: MemorySavedIndicatorProps) {
  const { theme } = useThemeContext();
  const isReducedMotion = useReducedMotion();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      // Show animation
      if (isReducedMotion) {
        // Instant show for reduced motion
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
      } else {
        // Gentle fade + scale in
        const animation = Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]);
        
        animationRef.current = animation;
        animation.start();
      }

      // Auto-hide after 2 seconds
      const hideTimeout = setTimeout(() => {
        if (isReducedMotion) {
          // Instant hide for reduced motion
          fadeAnim.setValue(0);
          scaleAnim.setValue(0.8);
          onHide?.();
        } else {
          // Gentle fade out
          const hideAnimation = Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
          ]);
          
          hideAnimation.start(() => {
            onHide?.();
          });
        }
      }, 2000);

      return () => {
        clearTimeout(hideTimeout);
        if (animationRef.current) {
          animationRef.current.stop();
        }
      };
    } else {
      // Reset animation values when not visible
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, scaleAnim, isReducedMotion, onHide]);

  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme.card,
            borderColor: theme.primary + '20',
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check_circle"
            size={20}
            color={theme.primary}
          />
        </View>
        <Text style={[styles.text, { color: theme.textPrimary }]}>
          Saved to help future conversations
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: '5%',
    right: '5%',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
    maxWidth: 320,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
  },
});
