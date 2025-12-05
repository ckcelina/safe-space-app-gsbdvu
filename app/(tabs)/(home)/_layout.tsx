
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        gestureEnabled: true,
        animation: 'default',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Home',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="add-person"
        options={{
          headerShown: false,
          title: 'Add Person',
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="chat"
        options={{
          headerShown: false,
          title: 'Chat',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
