
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export function ChatImageBubble({ imageUrl }: { imageUrl: string }) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});
