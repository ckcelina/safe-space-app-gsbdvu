
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { openSupportEmail } from '@/utils/supportHelpers';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { deleteUserAccount } from '@/utils/accountDeletion';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Switch,
  Linking,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { WidgetPreviewCard } from '@/components/ui/WidgetPreviewCard';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { THERAPIST_PERSONAS, getPersonaById } from '@/constants/TherapistPersonas';

interface PersonalizationUpdate {
  id: string;
  user_id: string;
  title: string;
  details?: string;
  started_at?: string;
  ai_preference?: string;
  created_at: string;
  updated_at: string;
}

const CONVERSATION_STYLES = [
  'Direct and solution-focused',
  'Gentle and exploratory',
  'Balanced approach',
];

const STRESS_RESPONSES = [
  'I need practical steps',
  'I need emotional support first',
  'Mix of both',
];

const PROCESSING_STYLES = [
  'Think out loud with me',
  'Let me reflect, then discuss',
  'Flexible based on topic',
];

const DECISION_STYLES = [
  'Help me see options clearly',
  'Challenge my thinking',
  'Support my intuition',
];

const AI_PREFERENCE_OPTIONS = [
  'More questions to help me think',
  'More direct guidance',
  'Balanced mix',
];

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function SettingsScreen() {
  const { authUser, signOut } = useAuth();
  const { theme, themeKey, setTheme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showPersonalizationInfoModal, setShowPersonalizationInfoModal] = useState(false);
  const [showClearPersonalizationModal, setShowClearPersonalizationModal] = useState(false);
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('dr-elias');
  const [previewPersonaId, setPreviewPersonaId] = useState<string | null>(null);

  const [conversationStyle, setConversationStyle] = useState<string>('');
  const [stressResponse, setStressResponse] = useState<string>('');
  const [processingStyle, setProcessingStyle] = useState<string>('');
  const [decisionStyle, setDecisionStyle] = useState<string>('');
  const [aiPreference, setAiPreference] = useState<string>('');
  const [isSavingPersonalization, setIsSavingPersonalization] = useState(false);

  const [updates, setUpdates] = useState<PersonalizationUpdate[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [expandedUpdateIds, setExpandedUpdateIds] = useState<Set<string>>(new Set());

  const [editingUpdate, setEditingUpdate] = useState<PersonalizationUpdate | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDetails, setUpdateDetails] = useState('');
  const [updateStartedAt, setUpdateStartedAt] = useState('');
  const [updateAiPreference, setUpdateAiPreference] = useState('');
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  const { preferences, updatePreferences } = useUserPreferences();

  useEffect(() => {
    if (preferences?.therapist_persona_id) {
      setSelectedPersonaId(preferences.therapist_persona_id);
    }
  }, [preferences]);

  useEffect(() => {
    if (showPersonalizationModal && preferences) {
      setConversationStyle(preferences.conversation_style || '');
      setStressResponse(preferences.stress_response || '');
      setProcessingStyle(preferences.processing_style || '');
      setDecisionStyle(preferences.decision_style || '');
      setAiPreference(preferences.ai_preference || '');
    }
  }, [showPersonalizationModal, preferences]);

  const handleThemeSelect = (newThemeKey: ThemeKey) => {
    setTheme(newThemeKey);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: handleSignOut },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      showErrorToast('Failed to sign out');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!authUser?.id) return;

    try {
      await deleteUserAccount(authUser.id);
      setShowDeleteModal(false);
      await signOut();
      router.replace('/');
      showSuccessToast('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      showErrorToast('Failed to delete account');
    }
  };

  const handleSupportPress = () => {
    openSupportEmail();
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://example.com/privacy');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://example.com/terms');
  };

  const handleInfoPress = () => {
    setShowInfoModal(true);
  };

  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
  };

  const handleOpenChangePasswordModal = () => {
    setShowChangePasswordModal(true);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCloseChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showErrorToast('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showSuccessToast('Password changed successfully');
      handleCloseChangePasswordModal();
    } catch (error) {
      console.error('Error changing password:', error);
      showErrorToast('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleOpenPersonaModal = () => {
    setShowPersonaModal(true);
  };

  const handleClosePersonaModal = () => {
    setShowPersonaModal(false);
    setPreviewPersonaId(null);
  };

  const handleSavePersona = async () => {
    try {
      await updatePreferences({ therapist_persona_id: selectedPersonaId });
      showSuccessToast('Therapist updated successfully');
      handleClosePersonaModal();
    } catch (error) {
      console.error('Error saving persona:', error);
      showErrorToast('Failed to update therapist');
    }
  };

  const handleOpenPreview = (personaId: string) => {
    setPreviewPersonaId(personaId);
    router.push({
      pathname: '/(tabs)/(home)/communication-style-preview',
      params: { personaId },
    });
  };

  const handleOpenPersonalizationModal = () => {
    setShowPersonalizationModal(true);
  };

  const handleClosePersonalizationModal = () => {
    setShowPersonalizationModal(false);
  };

  const handleSavePersonalization = async () => {
    setIsSavingPersonalization(true);
    try {
      await updatePreferences({
        conversation_style: conversationStyle,
        stress_response: stressResponse,
        processing_style: processingStyle,
        decision_style: decisionStyle,
        ai_preference: aiPreference,
      });
      showSuccessToast('Personalization saved successfully');
      handleClosePersonalizationModal();
    } catch (error) {
      console.error('Error saving personalization:', error);
      showErrorToast('Failed to save personalization');
    } finally {
      setIsSavingPersonalization(false);
    }
  };

  const handleOpenClearPersonalizationModal = () => {
    setShowClearPersonalizationModal(true);
  };

  const handleCloseClearPersonalizationModal = () => {
    setShowClearPersonalizationModal(false);
  };

  const handleConfirmClearPersonalization = async () => {
    try {
      await updatePreferences({
        conversation_style: null,
        stress_response: null,
        processing_style: null,
        decision_style: null,
        ai_preference: null,
      });
      setConversationStyle('');
      setStressResponse('');
      setProcessingStyle('');
      setDecisionStyle('');
      setAiPreference('');
      showSuccessToast('Personalization cleared successfully');
      handleCloseClearPersonalizationModal();
    } catch (error) {
      console.error('Error clearing personalization:', error);
      showErrorToast('Failed to clear personalization');
    }
  };

  const handleOpenPersonalizationInfoModal = () => {
    setShowPersonalizationInfoModal(true);
  };

  const handleClosePersonalizationInfoModal = () => {
    setShowPersonalizationInfoModal(false);
  };

  const fetchUpdates = async () => {
    if (!authUser?.id) return;

    setIsLoadingUpdates(true);
    try {
      const { data, error } = await supabase
        .from('personalization_updates')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
      showErrorToast('Failed to load updates');
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  const handleOpenUpdatesModal = () => {
    setShowUpdatesModal(true);
    fetchUpdates();
  };

  const handleCloseUpdatesModal = () => {
    setShowUpdatesModal(false);
  };

  const handleOpenAddUpdateModal = () => {
    setEditingUpdate(null);
    setUpdateTitle('');
    setUpdateDetails('');
    setUpdateStartedAt('');
    setUpdateAiPreference('');
    setShowAddUpdateModal(true);
  };

  const handleOpenEditUpdateModal = (update: PersonalizationUpdate) => {
    setEditingUpdate(update);
    setUpdateTitle(update.title);
    setUpdateDetails(update.details || '');
    setUpdateStartedAt(update.started_at || '');
    setUpdateAiPreference(update.ai_preference || '');
    setShowAddUpdateModal(true);
  };

  const handleCloseAddUpdateModal = () => {
    setShowAddUpdateModal(false);
    setEditingUpdate(null);
    setUpdateTitle('');
    setUpdateDetails('');
    setUpdateStartedAt('');
    setUpdateAiPreference('');
  };

  const validateUpdateInput = (): boolean => {
    if (!updateTitle.trim()) {
      showErrorToast('Please enter a title');
      return false;
    }
    return true;
  };

  const handleSaveUpdate = async () => {
    if (!validateUpdateInput() || !authUser?.id) return;

    setIsSavingUpdate(true);
    try {
      if (editingUpdate) {
        const { error } = await supabase
          .from('personalization_updates')
          .update({
            title: updateTitle.trim(),
            details: updateDetails.trim() || null,
            started_at: updateStartedAt.trim() || null,
            ai_preference: updateAiPreference.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUpdate.id);

        if (error) throw error;
        showSuccessToast('Update saved successfully');
      } else {
        const { error } = await supabase
          .from('personalization_updates')
          .insert({
            user_id: authUser.id,
            title: updateTitle.trim(),
            details: updateDetails.trim() || null,
            started_at: updateStartedAt.trim() || null,
            ai_preference: updateAiPreference.trim() || null,
          });

        if (error) throw error;
        showSuccessToast('Update added successfully');
      }

      handleCloseAddUpdateModal();
      fetchUpdates();
    } catch (error) {
      console.error('Error saving update:', error);
      showErrorToast('Failed to save update');
    } finally {
      setIsSavingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    Alert.alert(
      'Delete Update',
      'Are you sure you want to delete this update?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('personalization_updates')
                .delete()
                .eq('id', updateId);

              if (error) throw error;
              showSuccessToast('Update deleted successfully');
              fetchUpdates();
            } catch (error) {
              console.error('Error deleting update:', error);
              showErrorToast('Failed to delete update');
            }
          },
        },
      ]
    );
  };

  const toggleUpdateExpanded = (updateId: string) => {
    setExpandedUpdateIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPersonaCard = (personaId: string) => {
    const persona = getPersonaById(personaId);
    if (!persona) return null;

    const isSelected = selectedPersonaId === personaId;

    return (
      <Pressable
        key={personaId}
        style={[
          styles.personaCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: isSelected ? theme.primary : theme.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedPersonaId(personaId)}
      >
        <View style={styles.personaHeader}>
          <Image
            source={persona.avatar}
            style={styles.personaAvatar}
            contentFit="cover"
          />
          <View style={styles.personaInfo}>
            <Text style={[styles.personaName, { color: theme.text }]}>
              {persona.name}
            </Text>
            <Text style={[styles.personaTitle, { color: theme.textSecondary }]}>
              {persona.title}
            </Text>
          </View>
          {isSelected && (
            <IconSymbol
              name="checkmark.circle.fill"
              size={24}
              color={theme.primary}
            />
          )}
        </View>
        <Text style={[styles.personaDescription, { color: theme.textSecondary }]}>
          {persona.description}
        </Text>
        <TouchableOpacity
          style={[styles.previewButton, { backgroundColor: theme.primary + '20' }]}
          onPress={() => handleOpenPreview(personaId)}
        >
          <Text style={[styles.previewButtonText, { color: theme.primary }]}>
            Preview Style
          </Text>
        </TouchableOpacity>
      </Pressable>
    );
  };

  const renderOptionCard = (
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => {
    return (
      <View style={styles.optionGroup}>
        {options.map((option) => {
          const isSelected = selectedValue === option;
          return (
            <Pressable
              key={option}
              style={[
                styles.optionCard,
                {
                  backgroundColor: isSelected
                    ? theme.primary + '20'
                    : theme.cardBackground,
                  borderColor: isSelected ? theme.primary : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? theme.primary : theme.text },
                ]}
              >
                {option}
              </Text>
              {isSelected && (
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color={theme.primary}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  const currentPersona = getPersonaById(selectedPersonaId);

  return (
    // FIX: Ensure top-level container has flex: 1 for proper scrolling
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* FIX: Decorative gradient must have pointerEvents="none" to not block touches */}
      <LinearGradient
        colors={[theme.primary + '15', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: 200 }]}
        pointerEvents="none"
      />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <TouchableOpacity onPress={handleInfoPress} style={styles.infoButton}>
            <IconSymbol name="info.circle" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* FIX: Single ScrollView with flex: 1, no nesting */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
            
            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handleOpenChangePasswordModal}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="lock.fill" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Change Password
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handleLogout}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="arrow.right.square" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>Sign Out</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="trash" size={20} color="#FF3B30" />
                <Text style={[styles.settingText, { color: '#FF3B30' }]}>
                  Delete Account
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* AI Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Settings</Text>

            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handleOpenPersonaModal}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="person.fill" size={20} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingText, { color: theme.text }]}>
                    Therapist
                  </Text>
                  {currentPersona && (
                    <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
                      {currentPersona.name}
                    </Text>
                  )}
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handleOpenPersonalizationModal}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="slider.horizontal.3" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Personalization Settings
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handleOpenUpdatesModal}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="bell.fill" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Life Updates
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Theme Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
            <View style={styles.themeGrid}>
              {(['ocean-blue', 'soft-rose', 'forest-green'] as ThemeKey[]).map((key) => (
                <Pressable
                  key={key}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: themeKey === key ? theme.primary : theme.border,
                      borderWidth: themeKey === key ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleThemeSelect(key)}
                >
                  <View
                    style={[
                      styles.themePreview,
                      {
                        backgroundColor:
                          key === 'ocean-blue'
                            ? '#007AFF'
                            : key === 'soft-rose'
                            ? '#FF6B9D'
                            : '#34C759',
                      },
                    ]}
                  />
                  <Text style={[styles.themeText, { color: theme.text }]}>
                    {key === 'ocean-blue'
                      ? 'Ocean Blue'
                      : key === 'soft-rose'
                      ? 'Soft Rose'
                      : 'Forest Green'}
                  </Text>
                  {themeKey === key && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>

            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handleSupportPress}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="envelope.fill" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Contact Support
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handlePrivacyPress}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="hand.raised.fill" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Privacy Policy
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}
              onPress={handleTermsPress}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="doc.text.fill" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>
                  Terms of Service
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* FIX: All modals must only render when visible to avoid blocking touches */}
      {showInfoModal && (
        <Modal
          visible={showInfoModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseInfoModal}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCloseInfoModal}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                About Safe Space
              </Text>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                Version 1.0.0
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleCloseInfoModal}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={handleCancelDelete}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCancelDelete}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Delete Account
              </Text>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                Are you sure you want to delete your account? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.border }]}
                  onPress={handleCancelDelete}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {showChangePasswordModal && (
        <Modal
          visible={showChangePasswordModal}
          transparent
          animationType="slide"
          onRequestClose={handleCloseChangePasswordModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Pressable style={styles.modalOverlay} onPress={handleCloseChangePasswordModal}>
              <View
                style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}
                onStartShouldSetResponder={() => true}
              >
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Change Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="New Password"
                  placeholderTextColor={theme.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.border }]}
                    onPress={handleCloseChangePasswordModal}
                    disabled={isChangingPassword}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                    onPress={handleSavePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {showPersonaModal && (
        <Modal
          visible={showPersonaModal}
          transparent
          animationType="slide"
          onRequestClose={handleClosePersonaModal}
        >
          <View style={styles.fullModalOverlay}>
            <View style={[styles.fullModalContent, { backgroundColor: theme.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleClosePersonaModal}>
                  <IconSymbol name="xmark" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: theme.text }]}>
                  Choose Therapist
                </Text>
                <TouchableOpacity onPress={handleSavePersona}>
                  <Text style={[styles.saveText, { color: theme.primary }]}>Save</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.personaScrollContent}
              >
                {Object.keys(THERAPIST_PERSONAS).map((personaId) =>
                  renderPersonaCard(personaId)
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showPersonalizationModal && (
        <Modal
          visible={showPersonalizationModal}
          transparent
          animationType="slide"
          onRequestClose={handleClosePersonalizationModal}
        >
          <View style={styles.fullModalOverlay}>
            <View style={[styles.fullModalContent, { backgroundColor: theme.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleClosePersonalizationModal}>
                  <IconSymbol name="xmark" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: theme.text }]}>
                  Personalization
                </Text>
                <TouchableOpacity onPress={handleSavePersonalization}>
                  {isSavingPersonalization ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Text style={[styles.saveText, { color: theme.primary }]}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.personalizationScrollContent}
              >
                <View style={styles.personalizationSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.personalizationTitle, { color: theme.text }]}>
                      Conversation Style
                    </Text>
                    <TouchableOpacity onPress={handleOpenPersonalizationInfoModal}>
                      <IconSymbol name="info.circle" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {renderOptionCard(
                    CONVERSATION_STYLES,
                    conversationStyle,
                    setConversationStyle
                  )}
                </View>

                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationTitle, { color: theme.text }]}>
                    When I'm Stressed
                  </Text>
                  {renderOptionCard(STRESS_RESPONSES, stressResponse, setStressResponse)}
                </View>

                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationTitle, { color: theme.text }]}>
                    Processing Style
                  </Text>
                  {renderOptionCard(PROCESSING_STYLES, processingStyle, setProcessingStyle)}
                </View>

                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationTitle, { color: theme.text }]}>
                    Decision Making
                  </Text>
                  {renderOptionCard(DECISION_STYLES, decisionStyle, setDecisionStyle)}
                </View>

                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationTitle, { color: theme.text }]}>
                    AI Preference
                  </Text>
                  {renderOptionCard(
                    AI_PREFERENCE_OPTIONS,
                    aiPreference,
                    setAiPreference
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: theme.border }]}
                  onPress={handleOpenClearPersonalizationModal}
                >
                  <Text style={[styles.clearButtonText, { color: theme.text }]}>
                    Clear All Settings
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showPersonalizationInfoModal && (
        <Modal
          visible={showPersonalizationInfoModal}
          transparent
          animationType="fade"
          onRequestClose={handleClosePersonalizationInfoModal}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={handleClosePersonalizationInfoModal}
          >
            <View
              style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                About Personalization
              </Text>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                These settings help the AI understand your communication preferences and
                adapt its responses to better support you.
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleClosePersonalizationInfoModal}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {showClearPersonalizationModal && (
        <Modal
          visible={showClearPersonalizationModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseClearPersonalizationModal}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={handleCloseClearPersonalizationModal}
          >
            <View
              style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Clear Personalization
              </Text>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                Are you sure you want to clear all personalization settings?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.border }]}
                  onPress={handleCloseClearPersonalizationModal}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={handleConfirmClearPersonalization}
                >
                  <Text style={styles.modalButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {showUpdatesModal && (
        <Modal
          visible={showUpdatesModal}
          transparent
          animationType="slide"
          onRequestClose={handleCloseUpdatesModal}
        >
          <View style={styles.fullModalOverlay}>
            <View style={[styles.fullModalContent, { backgroundColor: theme.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleCloseUpdatesModal}>
                  <IconSymbol name="xmark" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: theme.text }]}>
                  Life Updates
                </Text>
                <TouchableOpacity onPress={handleOpenAddUpdateModal}>
                  <IconSymbol name="plus" size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.updatesScrollContent}
              >
                {isLoadingUpdates ? (
                  <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
                ) : updates.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                      No updates yet. Add one to help the AI understand your current
                      situation.
                    </Text>
                  </View>
                ) : (
                  updates.map((update) => {
                    const isExpanded = expandedUpdateIds.has(update.id);
                    return (
                      <Pressable
                        key={update.id}
                        style={[
                          styles.updateCard,
                          { backgroundColor: theme.cardBackground },
                        ]}
                        onPress={() => toggleUpdateExpanded(update.id)}
                      >
                        <View style={styles.updateHeader}>
                          <Text style={[styles.updateTitle, { color: theme.text }]}>
                            {update.title}
                          </Text>
                          <View style={styles.updateActions}>
                            <TouchableOpacity
                              onPress={() => handleOpenEditUpdateModal(update)}
                            >
                              <IconSymbol
                                name="pencil"
                                size={18}
                                color={theme.textSecondary}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteUpdate(update.id)}
                            >
                              <IconSymbol name="trash" size={18} color="#FF3B30" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        {update.started_at && (
                          <Text style={[styles.updateDate, { color: theme.textSecondary }]}>
                            Started: {formatRelativeDate(update.started_at)}
                          </Text>
                        )}
                        {isExpanded && update.details && (
                          <Text style={[styles.updateDetails, { color: theme.textSecondary }]}>
                            {update.details}
                          </Text>
                        )}
                        {isExpanded && update.ai_preference && (
                          <Text
                            style={[styles.updateAiPreference, { color: theme.textSecondary }]}
                          >
                            AI Preference: {update.ai_preference}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showAddUpdateModal && (
        <Modal
          visible={showAddUpdateModal}
          transparent
          animationType="slide"
          onRequestClose={handleCloseAddUpdateModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.fullModalOverlay}>
              <View style={[styles.fullModalContent, { backgroundColor: theme.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity onPress={handleCloseAddUpdateModal}>
                    <IconSymbol name="xmark" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalHeaderTitle, { color: theme.text }]}>
                    {editingUpdate ? 'Edit Update' : 'Add Update'}
                  </Text>
                  <TouchableOpacity onPress={handleSaveUpdate}>
                    {isSavingUpdate ? (
                      <ActivityIndicator color={theme.primary} />
                    ) : (
                      <Text style={[styles.saveText, { color: theme.primary }]}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.addUpdateScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Title *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.cardBackground,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="e.g., Starting new job"
                    placeholderTextColor={theme.textSecondary}
                    value={updateTitle}
                    onChangeText={setUpdateTitle}
                  />

                  <Text style={[styles.inputLabel, { color: theme.text }]}>Details</Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: theme.cardBackground,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Add more context..."
                    placeholderTextColor={theme.textSecondary}
                    value={updateDetails}
                    onChangeText={setUpdateDetails}
                    multiline
                    numberOfLines={4}
                  />

                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    When did this start?
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.cardBackground,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="e.g., Last week, 2 months ago"
                    placeholderTextColor={theme.textSecondary}
                    value={updateStartedAt}
                    onChangeText={setUpdateStartedAt}
                  />

                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    How should AI respond?
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: theme.cardBackground,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="e.g., Be encouraging, Ask about my feelings"
                    placeholderTextColor={theme.textSecondary}
                    value={updateAiPreference}
                    onChangeText={setUpdateAiPreference}
                    multiline
                    numberOfLines={3}
                  />
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  infoButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
  },
  settingSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  themeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  input: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullModalContent: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  personaScrollContent: {
    padding: 16,
    gap: 16,
  },
  personaCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personaAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 16,
    fontWeight: '600',
  },
  personaTitle: {
    fontSize: 14,
    marginTop: 2,
  },
  personaDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  personalizationScrollContent: {
    padding: 16,
    gap: 24,
  },
  personalizationSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personalizationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionGroup: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
  clearButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updatesScrollContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  updateCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  updateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  updateDate: {
    fontSize: 14,
  },
  updateDetails: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  updateAiPreference: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  addUpdateScrollContent: {
    padding: 16,
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
});
