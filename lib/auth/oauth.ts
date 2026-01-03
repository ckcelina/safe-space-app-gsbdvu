
import { makeRedirectUri } from 'expo-auth-session';

export const getGoogleRedirectUri = () => {
  return makeRedirectUri({
    scheme: 'safespace',
    path: 'auth/callback',
  });
};

export const getOAuthRedirectUri = (provider: string) => {
  return makeRedirectUri({
    scheme: 'safespace',
    path: `auth/${provider}/callback`,
  });
};
