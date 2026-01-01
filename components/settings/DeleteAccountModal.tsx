
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { deleteUserAccount } from '@/utils/accountDeletion';
import { showErrorToast } from '@/utils/toast';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string | null;
  onSuccess: () => void;
}

export function DeleteAccountModal({ visible, onClose, userId, onSuccess }: DeleteAccountModalProps) {
  const { theme } = useThemeContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!userId) {
      showErrorToast('User ID not found');
      onClose();
      return;
    }

    setIsDeleting(true);

    try {
      console.log('[DeleteAccountModal] Starting account deletion process...');
      const result = await deleteUserAccount(userId);

      if (result.success) {
        console.log('[DeleteAccountModal] Account deleted successfully');
        onClose();
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        console.error('[DeleteAccountModal] Account deletion failed:', result.error);
        onClose();
        showErrorToast('Something went wrong. Please try again.');
      }
    } catch (error: any) {
      console.error('[DeleteAccountModal] Unexpected error deleting account:', error);
      onClose();
      showErrorToast('Something went wrong. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={onClose}
        pointerEvents="auto"
      >
        <Pressable 
          style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}
          onPress={(e) => e.stopPropagation()}
          pointerEvents="auto"
        >
          <View style={styles.modalIconContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color="#FF3B30"
            />
          </View>

          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
            Delete account?
          </Text>

          <Text style={[styles.modalText, { color: theme.textSecondary }]}>
            This action is permanent and cannot be undone.
          </Text>

          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
              onPress={onClose}
              disabled={isDeleting}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modalButtonHalf, styles.confirmDeleteButton]}
              onPress={handleConfirmDelete}
              disabled={isDeleting}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              )}
            </Pressable>
          </View>
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonHalf: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#FF3B30',
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
