
import React, { ReactNode, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAvoiderProps {
  children: ReactNode;
  style?: ViewStyle;
  /**
   * Additional offset to add on top of safe area insets.
   * Use this for header heights if needed.
   * Default: 0
   */
  additionalOffset?: number;
  /**
   * Whether to use 'padding' or 'position' behavior on iOS.
   * Default: 'padding'
   */
  iosBehavior?: 'padding' | 'position';
  /**
   * Whether to enable keyboard avoidance.
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Universal keyboard avoidance component that eliminates gaps between
 * the keyboard and input fields across all screens.
 *
 * Features:
 * - Platform-specific behavior (iOS: padding, Android: relies on windowSoftInputMode)
 * - Correct keyboardVerticalOffset calculation using safe area insets
 * - No extra padding/margin that causes gaps
 * - Works in modals and bottom sheets
 *
 * Usage:
 * <KeyboardAvoider>
 *   <YourContent />
 * </KeyboardAvoider>
 */
export function KeyboardAvoider({
  children,
  style,
  additionalOffset = 0,
  iosBehavior = 'padding',
  enabled = true,
}: KeyboardAvoiderProps) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Calculate keyboard offset
  // On iOS: use top inset + additional offset (for headers, etc.)
  // On Android: behavior is undefined, rely on windowSoftInputMode="adjustResize"
  const keyboardVerticalOffset = Platform.OS === 'ios' 
    ? insets.top + additionalOffset 
    : 0;

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? iosBehavior : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled={enabled}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
