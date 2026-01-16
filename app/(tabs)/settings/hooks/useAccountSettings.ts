
/**
 * useAccountSettings Hook
 * 
 * Hook for managing account-related settings: password changes, account deletion, etc.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { deleteUserAccount } from '@/utils/accountDeletion';
import { supabase } from '@/lib/supabase';

export interface UseAccountSettingsReturn {
  showChangePasswordModal: boolean;
  showDeleteModal: boolean;
  isUpdatingPassword: boolean;
  isDeleting: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  setCurrentPassword: (password: string) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  handleOpenChangePasswordModal: () => void;
  handleCloseChangePasswordModal: () => void;
  handleSavePassword: () => Promise<void>;
  handleDeleteAccount: () => void;
  handleCancelDelete: () => void;
  handleConfirmDelete: () => Promise<void>;
  handleSignOut: () => void;
}

export function useAccountSettings(): UseAccountSettingsReturn {
  const { userId, signOut } = useAuth();
  const { error: showError, success } = useToast();
  
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleOpenChangePasswordModal = useCallback(() => {
    console.log('[Settings] Change password button pressed');
    setShowChangePasswordModal(true);
  }, []);

  const handleCloseChangePasswordModal = useCallback(() => {
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, []);

  const handleSavePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      console.log('[Settings] Updating password...');
      
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error('[Settings] Password update error:', error);
        showError(error.message || 'Failed to update password');
        setIsUpdatingPassword(false);
        return;
      }

      console.log('[Settings] Password updated successfully');
      success('Password updated');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);
    } catch (error: any) {
      console.error('[Settings] Unexpected error updating password:', error);
      showError('Something went wrong. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword, showError, success]);

  const handleDeleteAccount = useCallback(() => {
    console.log('[Settings] Delete account button pressed');
    setShowDeleteModal(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!userId) {
      showError('User ID not found');
      setShowDeleteModal(false);
      return;
    }

    setIsDeleting(true);

    try {
      console.log('[Settings] Starting account deletion process...');
      const result = await deleteUserAccount(userId);

      if (result.success) {
        console.log('[Settings] Account deleted successfully');
        setShowDeleteModal(false);
        
        await signOut();
        
        setTimeout(() => {
          router.replace('/onboarding');
        }, 500);
      } else {
        console.error('[Settings] Account deletion failed:', result.error);
        setShowDeleteModal(false);
        showError('Something went wrong. Please try again.');
      }
    } catch (error: any) {
      console.error('[Settings] Unexpected error deleting account:', error);
      setShowDeleteModal(false);
      showError('Something went wrong. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [userId, signOut, showError]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Settings] Starting sign out...');
              await signOut();
              console.log('[Settings] Sign out successful, navigating to onboarding');
              setTimeout(() => {
                router.replace('/onboarding');
              }, 100);
            } catch (error) {
              console.error('[Settings] signOut error:', error);
              showError("Couldn't log out. Please try again.");
            }
          },
        },
      ]
    );
  }, [signOut, showError]);

  return {
    showChangePasswordModal,
    showDeleteModal,
    isUpdatingPassword,
    isDeleting,
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleOpenChangePasswordModal,
    handleCloseChangePasswordModal,
    handleSavePassword,
    handleDeleteAccount,
    handleCancelDelete,
    handleConfirmDelete,
    handleSignOut,
  };
}

