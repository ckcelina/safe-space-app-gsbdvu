
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InfoModal({ visible, onClose }: InfoModalProps) {
  const { theme } = useThemeContext();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable 
          style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalIconContainer}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={48}
              color={theme.primary}
            />
          </View>

          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
            Settings
          </Text>

          <Text style={[styles.modalText, { color: theme.textSecondary }]}>
            Here you can update your theme and manage your account.
          </Text>

          <Pressable
            style={[styles.modalButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.modalButtonText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
  },
  modalContent: {
    borderRadius: 20,
    padding: '8%',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: '5%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: '7%',
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
