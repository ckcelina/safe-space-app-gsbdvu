
import React from "react";
import { Stack } from "expo-router";

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="(home)" options={{ gestureEnabled: false, animation: "fade" }} />
      <Stack.Screen name="library" options={{ gestureEnabled: false, animation: "fade" }} />
      <Stack.Screen
        name="settings"
        options={{
          gestureEnabled: true,
          animation: "slide_from_right",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
