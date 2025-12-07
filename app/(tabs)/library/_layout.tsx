
import { Stack } from 'expo-router';

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
          title: 'Library',
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
