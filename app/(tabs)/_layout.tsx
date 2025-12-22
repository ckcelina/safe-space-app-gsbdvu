
import React from 'react';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tab bar height: 60px (tabsContainer) + 20px (default bottomMargin) = 80px
const TAB_BAR_HEIGHT = 80;

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
        // Add bottom padding to prevent content from being hidden behind the floating tab bar
        sceneContainerStyle: { 
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom 
        },
      }}
    >
      <Stack.Screen 
        key="home" 
        name="(home)" 
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        key="library" 
        name="library"
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        key="settings" 
        name="settings"
        options={{
          gestureEnabled: true,
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
