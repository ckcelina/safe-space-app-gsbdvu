
import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface KeyboardAvoiderProps {
  children: ReactNode;
  style?: ViewStyle;
  /**
   * Whether to enable keyboard avoidance.
   * Default: true
   */
  enabled?: boolean;
  /**
   * Additional offset for special cases (e.g., headers in modals).
   * Use sparingly - most cases should use 0.
   * Default: 0
   */
  additionalOffset?: number;
}

/**
 * Universal keyboard avoidance component that eliminates gaps between
 * the keyboard and input fields across all screens.
 *
 * KEY FEATURES:
 * - NO GAPS: Input sits directly on keyboard with zero space
 * - Platform-specific behavior (iOS: padding, Android: height)
 * - Zero keyboardVerticalOffset by default (no extra spacing)
 * - Works in modals, bottom sheets, and regular screens
 * - Single source of truth for keyboard handling
 *
 * USAGE:
 * Wrap your screen content (including ScrollView if needed):
 * 
 * <KeyboardAvoider>
 *   <ScrollView>
 *     <YourContent />
 *   </ScrollView>
 * </KeyboardAvoider>
 *
 * For modals, wrap the modal content:
 * 
 * <Modal>
 *   <KeyboardAvoider>
 *     <YourModalContent />
 *   </KeyboardAvoider>
 * </Modal>
 */
export function KeyboardAvoider({
  children,
  style,
  enabled = true,
  additionalOffset = 0,
}: KeyboardAvoiderProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={additionalOffset}
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
