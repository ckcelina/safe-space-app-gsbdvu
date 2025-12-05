
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'settings',
      label: 'Settings',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen 
          key="home" 
          name="(home)" 
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          key="settings" 
          name="settings"
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
