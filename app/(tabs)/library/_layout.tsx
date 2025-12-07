
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
      <Stack.Screen 
        name="detail" 
        options={{
          headerShown: false,
          title: 'Topic Details',
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
