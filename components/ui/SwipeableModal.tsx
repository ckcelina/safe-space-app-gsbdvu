
import React, { ReactNode } from 'react';
import { Modal, View, StyleSheet } from 'react-native';

interface SwipeableModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function SwipeableModal({ visible, onClose, children }: SwipeableModalProps) {
  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <View style={styles.container}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
