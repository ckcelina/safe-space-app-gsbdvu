
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
}

/**
 * UNIVERSAL KEYBOARD HANDLER - SINGLE SOURCE OF TRUTH
 * 
 * RULES:
 * - iOS: behavior="padding" (moves content up)
 * - Android: behavior="height" (resizes container)
 * - keyboardVerticalOffset: 0 (NO GAPS, input sits directly on keyboard)
 * - Use ONE per screen/modal (never nest)
 * 
 * USAGE:
 * <KeyboardAvoider>
 *   <ScrollView keyboardShouldPersistTaps="handled">
 *     <YourContent />
 *   </ScrollView>
 * </KeyboardAvoider>
 * 
 * DO NOT:
 * - Add paddingBottom to inputs
 * - Add marginBottom spacers
 * - Nest KeyboardAvoidingViews
 * - Use different keyboard logic per screen
 */
export function KeyboardAvoider({
  children,
  style,
  enabled = true,
}: KeyboardAvoiderProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
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
