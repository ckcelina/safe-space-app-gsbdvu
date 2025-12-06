
import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
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
