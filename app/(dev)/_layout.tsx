
import { Stack } from 'expo-router';

/**
 * Dev-only route group layout
 * Contains diagnostic and debugging screens
 */
export default function DevLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="provider-health"
        options={{
          title: 'Provider Health',
          presentation: 'modal',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
