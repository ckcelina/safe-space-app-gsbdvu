
import { Alert, Platform, ToastAndroid } from 'react-native';

/**
 * Show a toast message to the user
 * On Android, uses native ToastAndroid
 * On iOS/Web, uses Alert
 */
export function showToast(message: string, duration: 'short' | 'long' = 'short') {
  console.log('Toast:', message);
  
  if (Platform.OS === 'android') {
    const toastDuration = duration === 'short' 
      ? ToastAndroid.SHORT 
      : ToastAndroid.LONG;
    ToastAndroid.show(message, toastDuration);
  } else {
    // For iOS and web, use Alert
    Alert.alert('', message, [{ text: 'OK' }]);
  }
}

/**
 * Show an error toast with a red icon (iOS) or error styling
 */
export function showErrorToast(message: string) {
  console.error('Error Toast:', message);
  
  if (Platform.OS === 'android') {
    ToastAndroid.show(`❌ ${message}`, ToastAndroid.LONG);
  } else {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  }
}

/**
 * Show a success toast with a green checkmark
 */
export function showSuccessToast(message: string) {
  console.log('Success Toast:', message);
  
  if (Platform.OS === 'android') {
    ToastAndroid.show(`✅ ${message}`, ToastAndroid.SHORT);
  } else {
    Alert.alert('Success', message, [{ text: 'OK' }]);
  }
}
