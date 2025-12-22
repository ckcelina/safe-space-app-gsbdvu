
import React from "react";
import { Stack } from "expo-router";

// ✅ NO bottom padding at navigator level
// The FloatingTabBar is absolute-positioned and handles its own spacing
// Individual screens will handle their own content padding if needed

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: false,
        // ✅ Remove contentStyle padding - no blank area at bottom
        contentStyle: { paddingBottom: 0 },
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
