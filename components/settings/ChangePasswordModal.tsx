
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
  const { theme } = useThemeContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showErrorToast('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showErrorToast('Password must be at least 8 characters');
      return;
    }

    setIsUpdating(true);

    try {
      console.log('[ChangePasswordModal] Updating password...');
      
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error('[ChangePasswordModal] Password update error:', error);
        showErrorToast(error.message || 'Failed to update password');
        setIsUpdating(false);
        return;
      }

      console.log('[ChangePasswordModal] Password updated successfully');
      showSuccessToast('Password updated');
      handleClose();
    } catch (error: any) {
      console.error('[ChangePasswordModal] Unexpected error updating password:', error);
      showErrorToast('Something went wrong. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
        pointerEvents="box-none"
      >
        <Pressable 
          style={{ flex: 1 }} 
          onPress={handleClose}
          pointerEvents="auto"
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={false}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}
              onPress={(e) => e.stopPropagation()}
              pointerEvents="auto"
            >
              <View style={styles.modalIconContainer}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={48}
                  color={theme.primary}
                />
              </View>

              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Change password
              </Text>

              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                Update your password to keep your account secure.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Current password
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.primary,
                    },
                  ]}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  autoCapitalize="none"
                  editable={!isUpdating}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  New password
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.primary,
                    },
                  ]}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                  editable={!isUpdating}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Confirm new password
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.primary,
                    },
                  ]}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  editable={!isUpdating}
                />
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                  onPress={handleClose}
                  disabled={isUpdating}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButtonHalf, { backgroundColor: theme.primary }]}
                  onPress={handleSave}
                  disabled={isUpdating}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
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
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: '10%',
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
  inputContainer: {
    marginBottom: '5%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
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
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
