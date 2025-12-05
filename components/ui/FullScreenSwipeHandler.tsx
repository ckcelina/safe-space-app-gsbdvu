
import React, { useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

interface FullScreenSwipeHandlerProps {
  children: React.ReactNode;
  enabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export function FullScreenSwipeHandler({
  children,
  enabled = true,
  onSwipeStart,
  onSwipeEnd,
}: FullScreenSwipeHandlerProps) {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!enabled) return false;
        
        // Only respond to horizontal swipes from left edge (anywhere on left 30% of screen)
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isRightSwipe = gestureState.dx > 10;
        
        return isHorizontalSwipe && isRightSwipe;
      },
      onPanResponderGrant: () => {
        onSwipeStart?.();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
          // Fade out slightly as we swipe
          const newOpacity = 1 - (gestureState.dx / SCREEN_WIDTH) * 0.3;
          opacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldGoBack =
          gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > SWIPE_VELOCITY_THRESHOLD;

        if (shouldGoBack) {
          // Complete the swipe and go back
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: SCREEN_WIDTH,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            translateX.setValue(0);
            opacity.setValue(1);
            router.back();
            onSwipeEnd?.();
          });
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
          ]).start(() => {
            onSwipeEnd?.();
          });
        }
      },
    })
  ).current;

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
