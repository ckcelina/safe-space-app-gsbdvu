
import { Linking, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/**
 * Safely opens a mailto link with proper encoding and fallback handling
 * @param subject - Email subject line
 * @param body - Email body content
 */
export const handleSupportEmail = async (subject: string, body: string): Promise<void> => {
  try {
    // Properly encode subject and body for mailto URL
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:support@byceli.com?subject=${encodedSubject}&body=${encodedBody}`;

    // Check if the device can open mailto links
    const canOpen = await Linking.canOpenURL(mailtoUrl);

    if (canOpen) {
      await Linking.openURL(mailtoUrl);
    } else {
      // Fallback: Show alert with copy option
      showEmailFallback(body);
    }
  } catch (error) {
    console.error('Error opening support email:', error);
    // If any error occurs, show fallback
    showEmailFallback(body);
  }
};

/**
 * Shows a fallback alert when mailto links cannot be opened
 * @param body - Email body content to copy
 */
const showEmailFallback = (body: string) => {
  Alert.alert(
    'Email Unavailable',
    `Please send your message to support@byceli.com\n\nYou can copy the message below:`,
    [
      {
        text: 'Copy Email',
        onPress: async () => {
          await Clipboard.setStringAsync('support@byceli.com');
          Alert.alert('Copied!', 'Email address copied to clipboard');
        },
      },
      {
        text: 'Copy Message',
        onPress: async () => {
          await Clipboard.setStringAsync(body);
          Alert.alert('Copied!', 'Message copied to clipboard');
        },
      },
      { text: 'OK', style: 'cancel' },
    ]
  );
};

/**
 * Quick contact support with a predefined message
 */
export const contactSupport = async (message?: string) => {
  const defaultMessage = message || 'I need help with the app.';
  await handleSupportEmail('Support Request', defaultMessage);
};
