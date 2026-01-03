
import { makeRedirectUri } from 'expo-auth-session';

// Apple authentication removed - expo-apple-authentication not configured
export const getAppleRedirectUri = () => {
  return makeRedirectUri({
    scheme: 'safespace',
    path: 'auth/callback',
  });
};
