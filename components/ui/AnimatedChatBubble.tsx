
import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

export function AnimatedChatBubble({ children }: { children: ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 5,
  },
});
