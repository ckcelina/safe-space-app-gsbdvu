
import * as MailComposer from 'expo-mail-composer';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Opens the user's email app with a pre-filled support email
 */
export async function openSupportEmail() {
  try {
    // Get app version and platform info
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const platform = Platform.OS;
    const platformVersion = Platform.Version;

    // Check if mail composer is available
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (!isAvailable) {
      // Fallback to mailto: link
      const subject = encodeURIComponent('Safe Space Support');
      const body = encodeURIComponent(
        `\n\n---\nApp Version: ${appVersion}\nPlatform: ${platform} ${platformVersion}\n`
      );
      await Linking.openURL(`mailto:support@example.com?subject=${subject}&body=${body}`);
      return;
    }

    // Compose email with pre-filled information
    await MailComposer.composeAsync({
      recipients: ['support@example.com'],
      subject: 'Safe Space Support',
      body: `\n\n---\nApp Version: ${appVersion}\nPlatform: ${platform} ${platformVersion}\n`,
    });
  } catch (error) {
    console.error('Error opening support email:', error);
    // Last resort fallback
    await Linking.openURL('mailto:support@example.com');
  }
}

/**
 * Opens a URL in the device's browser or in-app browser
 */
export async function openURL(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  } catch (error) {
    console.error('Error opening URL:', error);
  }
}

// Placeholder URLs - can be easily replaced later
export const LEGAL_URLS = {
  terms: 'https://example.com/terms',
  privacy: 'https://example.com/privacy',
};
