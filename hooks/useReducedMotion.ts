
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook to detect if the user has enabled reduced motion in system settings.
 * Returns true if reduced motion is enabled, false otherwise.
 * 
 * This respects the user's accessibility preferences and should be used
 * to disable or simplify animations throughout the app.
 */
export function useReducedMotion(): boolean {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        setIsReducedMotionEnabled(enabled ?? false);
      })
      .catch((error) => {
        console.warn('[useReducedMotion] Error checking reduced motion:', error);
        // Default to false if we can't check
        setIsReducedMotionEnabled(false);
      });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setIsReducedMotionEnabled(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isReducedMotionEnabled;
}
