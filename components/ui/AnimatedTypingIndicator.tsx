
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { useThemeContext } from '@/contexts/ThemeContext';
import { AIHeaderRow } from './AIHeaderRow';

interface AnimatedTypingIndicatorProps {
  therapistAvatarSource?: ImageSourcePropType;
  therapistPersonaId?: string;
  therapistName?: string;
}

export function AnimatedTypingIndicator({
  therapistAvatarSource,
  therapistPersonaId,
  therapistName,
}: AnimatedTypingIndicatorProps) {
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
            toValue: 1,
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

    const animations = Animated.parallel([
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 150),
      createDotAnimation(dot3Anim, 300),
    ]);

    animations.start();

    return () => {
      animations.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  const dotOpacity = (animValue: Animated.Value) => ({
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  });

  return (
    <View style={styles.container}>
      {therapistName && therapistAvatarSource && (
        <AIHeaderRow
          therapistName={therapistName}
          therapistAvatarSource={therapistAvatarSource}
        />
      )}
      
      <View style={styles.bubbleWrapper}>
        {therapistAvatarSource && (
          <Image
            source={therapistAvatarSource}
            style={styles.avatarIcon}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
          />
        )}
        
        <View style={[styles.bubble, { backgroundColor: theme.card }]}>
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: theme.textSecondary },
                dotOpacity(dot1Anim),
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: theme.textSecondary },
                dotOpacity(dot2Anim),
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: theme.textSecondary },
                dotOpacity(dot3Anim),
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  avatarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
