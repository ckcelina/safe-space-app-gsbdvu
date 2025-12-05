
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

export function TypingIndicator() {
  const { theme } = useThemeContext();
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 150),
      createDotAnimation(dot3Anim, 300),
    ]);

    animation.start();

    return () => animation.stop();
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.container}>
      <View style={[styles.aiIcon, { backgroundColor: theme.background }]}>
        <IconSymbol
          ios_icon_name="sparkles"
          android_material_icon_name="auto_awesome"
          size={16}
          color={theme.primary}
        />
      </View>

      <View style={[styles.bubble, { backgroundColor: theme.card }]}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: theme.textSecondary,
                transform: [{ translateY: dot1Anim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: theme.textSecondary,
                transform: [{ translateY: dot2Anim }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: theme.textSecondary,
                transform: [{ translateY: dot3Anim }],
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
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
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
