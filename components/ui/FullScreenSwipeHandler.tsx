
import React, { ReactNode } from 'react';
import { View } from 'react-native';

export function FullScreenSwipeHandler({ children, onSwipeRight }: { children: ReactNode; onSwipeRight?: () => void }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
