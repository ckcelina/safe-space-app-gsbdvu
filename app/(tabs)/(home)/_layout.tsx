
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Home'
        }}
      />
      <Stack.Screen
        name="add-person"
        options={{
          headerShown: false,
          title: 'Add Person',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="chat"
        options={{
          headerShown: false,
          title: 'Chat',
        }}
      />
    </Stack>
  );
}
