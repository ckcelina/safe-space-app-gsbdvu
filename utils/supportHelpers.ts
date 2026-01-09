
import * as Linking from 'expo-linking';

/**
 * Opens the user's email app with a pre-filled support email
 */
export async function openSupportEmail() {
  const email = 'support@byceli.com';
  const subject = 'Safe Space App Support';
  const body = 'Hi Support Team,';
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  try {
    const supported = await Linking.canOpenURL(mailtoUrl);
    if (supported) {
      await Linking.openURL(mailtoUrl);
    } else {
      console.warn('[SupportHelpers] Cannot open email URL');
    }
  } catch (error) {
    console.error('[SupportHelpers] Error opening email:', error);
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
