
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
        animationDuration: 300,
        customAnimationOnGesture: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Home',
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="add-person"
        options={{
          headerShown: false,
          title: 'Add Person',
          presentation: 'modal',
          gestureEnabled: true,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="chat"
        options={{
          headerShown: false,
          title: 'Chat',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
