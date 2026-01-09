
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { BiometricLockProvider } from '@/contexts/BiometricLockContext';
import { BiometricLockScreen } from '@/components/ui/BiometricLockScreen';
import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <CustomThemeProvider>
          <AuthProvider>
            <UserPreferencesProvider>
              <BiometricLockProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <BiometricLockScreen />
                <StatusBar style="auto" />
              </BiometricLockProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </CustomThemeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
