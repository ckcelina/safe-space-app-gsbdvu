
import { Alert, Platform } from 'react-native';

export function showSuccessToast(message: string) {
  if (Platform.OS === 'web') {
    console.log('✅', message);
  } else {
    Alert.alert('Success', message);
  }
}

export function showErrorToast(message: string) {
  if (Platform.OS === 'web') {
    console.error('❌', message);
  } else {
    Alert.alert('Error', message);
  }
}

export function showInfoToast(message: string) {
  if (Platform.OS === 'web') {
    console.info('ℹ️', message);
  } else {
    Alert.alert('Info', message);
  }
}
