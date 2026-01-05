
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
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { THERAPIST_PERSONAS, getPersonaById } from '@/constants/TherapistPersonas';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { WidgetPreviewCard } from '@/components/ui/WidgetPreviewCard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { openSupportEmail } from '@/utils/supportHelpers';
import { router } from 'expo-router';
import { deleteUserAccount } from '@/utils/accountDeletion';
import { IconSymbol } from '@/components/IconSymbol';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';

// Import modals
import { InfoModal } from '@/components/settings/InfoModal';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { TherapistPersonaModal } from '@/components/settings/TherapistPersonaModal';
import { PersonalizationInfoModal } from '@/components/settings/PersonalizationInfoModal';
import { ClearPersonalizationModal } from '@/components/settings/ClearPersonalizationModal';
import { PersonalizationModal } from '@/components/settings/PersonalizationModal';
import { UpdatesOverTimeModal } from '@/components/settings/UpdatesOverTimeModal';

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
  'Direct & Concise',
  'Warm & Supportive',
  'Reflective & Thoughtful',
  'Practical & Solution-Focused',
];

const STRESS_RESPONSES = [
  'Talk it through',
  'Need space first',
  'Want practical advice',
  'Prefer validation',
];

const PROCESSING_STYLES = [
  'Think out loud',
  'Process internally',
  'Need time to reflect',
  'Prefer immediate feedback',
];

const DECISION_STYLES = [
  'Weigh all options',
  'Trust my gut',
  'Seek others\' input',
  'Make quick decisions',
];

const AI_PREFERENCE_OPTIONS = [
  'More questions',
  'More advice',
  'Balanced approach',
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
  const insets = useSafeAreaInsets();
  const { theme, themeKey, setTheme } = useThemeContext();
  const { width } = useWindowDimensions();
  const { currentUser, role, signOut } = useAuth();
  const { preferences, updatePreferences } = useUserPreferences();

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showPersonalizationInfoModal, setShowPersonalizationInfoModal] = useState(false);
  const [showClearPersonalizationModal, setShowClearPersonalizationModal] = useState(false);
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false);

  const [conversationStyle, setConversationStyle] = useState(preferences.conversation_style || '');
  const [stressResponse, setStressResponse] = useState(preferences.stress_response || '');
  const [processingStyle, setProcessingStyle] = useState(preferences.processing_style || '');
  const [decisionStyle, setDecisionStyle] = useState(preferences.decision_style || '');
  const [aiPreference, setAiPreference] = useState(preferences.ai_preference || '');

  const [updates, setUpdates] = useState<PersonalizationUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<PersonalizationUpdate | null>(null);
  const [expandedUpdateIds, setExpandedUpdateIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setConversationStyle(preferences.conversation_style || '');
    setStressResponse(preferences.stress_response || '');
    setProcessingStyle(preferences.processing_style || '');
    setDecisionStyle(preferences.decision_style || '');
    setAiPreference(preferences.ai_preference || '');
  }, [preferences]);

  useEffect(() => {
    if (showUpdatesModal || showAddUpdateModal) {
      fetchUpdates();
    }
  }, [showUpdatesModal, showAddUpdateModal]);

  useEffect(() => {
    console.log('[Settings] Current theme:', themeKey);
  }, [themeKey]);

  const handleThemeSelect = (newThemeKey: ThemeKey) => {
    console.log('[Settings] Theme selected:', newThemeKey);
    setTheme(newThemeKey);
    showSuccessToast('Theme updated');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: handleSignOut },
      ],
      { cancelable: true }
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error: any) {
      console.error('[Settings] Sign out error:', error);
      showErrorToast('Failed to sign out');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(home)');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!currentUser?.id) {
      showErrorToast('User ID not found');
      return;
    }

    try {
      const result = await deleteUserAccount(currentUser.id);
      if (result.success) {
        setShowDeleteModal(false);
        router.replace('/login');
      } else {
        showErrorToast('Failed to delete account');
      }
    } catch (error) {
      console.error('[Settings] Delete account error:', error);
      showErrorToast('Failed to delete account');
    }
  };

  const handleSupportPress = () => {
    openSupportEmail();
  };

  const handlePrivacyPress = () => {
    router.push('/legal/privacy-policy');
  };

  const handleTermsPress = () => {
    router.push('/legal/terms-of-service');
  };

  const handleInfoPress = () => {
    setShowInfoModal(true);
  };

  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
  };

  const handleOpenChangePasswordModal = () => {
    setShowChangePasswordModal(true);
  };

  const handleCloseChangePasswordModal = () => {
    setShowChangePasswordModal(false);
  };

  const handleSavePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showSuccessToast('Password updated successfully');
      handleCloseChangePasswordModal();
    } catch (error: any) {
      console.error('[Settings] Password update error:', error);
      showErrorToast(error.message || 'Failed to update password');
    }
  };

  const handleOpenPersonaModal = () => {
    setShowPersonaModal(true);
  };

  const handleClosePersonaModal = () => {
    setShowPersonaModal(false);
  };

  const handleSavePersona = async (personaId: string) => {
    try {
      await updatePreferences({ therapist_persona_id: personaId });
      showSuccessToast('Communication style updated');
      handleClosePersonaModal();
    } catch (error) {
      console.error('[Settings] Save persona error:', error);
      showErrorToast('Failed to update communication style');
    }
  };

  const handleOpenPreview = (personaId: string) => {
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
    try {
      await updatePreferences({
        conversation_style: conversationStyle,
        stress_response: stressResponse,
        processing_style: processingStyle,
        decision_style: decisionStyle,
        ai_preference: aiPreference,
      });
      showSuccessToast('Personalization saved');
      handleClosePersonalizationModal();
    } catch (error) {
      console.error('[Settings] Save personalization error:', error);
      showErrorToast('Failed to save personalization');
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
        conversation_style: '',
        stress_response: '',
        processing_style: '',
        decision_style: '',
        ai_preference: '',
      });
      setConversationStyle('');
      setStressResponse('');
      setProcessingStyle('');
      setDecisionStyle('');
      setAiPreference('');
      showSuccessToast('Personalization cleared');
      handleCloseClearPersonalizationModal();
    } catch (error) {
      console.error('[Settings] Clear personalization error:', error);
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
    if (!currentUser?.id) return;

    setLoadingUpdates(true);
    try {
      const { data, error } = await supabase
        .from('personalization_updates')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUpdates(data || []);
    } catch (error) {
      console.error('[Settings] Fetch updates error:', error);
      showErrorToast('Failed to load updates');
    } finally {
      setLoadingUpdates(false);
    }
  };

  const handleOpenUpdatesModal = () => {
    setShowUpdatesModal(true);
  };

  const handleCloseUpdatesModal = () => {
    setShowUpdatesModal(false);
  };

  const handleOpenAddUpdateModal = () => {
    setEditingUpdate(null);
    setShowAddUpdateModal(true);
  };

  const handleOpenEditUpdateModal = (update: PersonalizationUpdate) => {
    setEditingUpdate(update);
    setShowAddUpdateModal(true);
  };

  const handleCloseAddUpdateModal = () => {
    setShowAddUpdateModal(false);
    setEditingUpdate(null);
  };

  const validateUpdateInput = (title: string): boolean => {
    return title.trim().length > 0;
  };

  const handleSaveUpdate = async (
    title: string,
    details: string,
    startedAt: string,
    aiPreferenceValue: string
  ) => {
    if (!currentUser?.id) return;

    if (!validateUpdateInput(title)) {
      showErrorToast('Please enter a title');
      return;
    }

    try {
      if (editingUpdate) {
        const { error } = await supabase
          .from('personalization_updates')
          .update({
            title,
            details: details || null,
            started_at: startedAt || null,
            ai_preference: aiPreferenceValue || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUpdate.id);

        if (error) throw error;
        showSuccessToast('Update saved');
      } else {
        const { error } = await supabase
          .from('personalization_updates')
          .insert({
            user_id: currentUser.id,
            title,
            details: details || null,
            started_at: startedAt || null,
            ai_preference: aiPreferenceValue || null,
          });

        if (error) throw error;
        showSuccessToast('Update added');
      }

      handleCloseAddUpdateModal();
      fetchUpdates();
    } catch (error) {
      console.error('[Settings] Save update error:', error);
      showErrorToast('Failed to save update');
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    try {
      const { error } = await supabase
        .from('personalization_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;

      showSuccessToast('Update deleted');
      fetchUpdates();
    } catch (error) {
      console.error('[Settings] Delete update error:', error);
      showErrorToast('Failed to delete update');
    }
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

    return (
      <View style={[styles.personaCard, { backgroundColor: theme.background }]}>
        <Image
          source={persona.image}
          style={styles.personaAvatar}
          contentFit="cover"
        />
        <View style={styles.personaInfo}>
          <Text style={[styles.personaName, { color: theme.textPrimary }]}>
            {persona.name}
          </Text>
          <Text style={[styles.personaDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {persona.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderOptionCard = (
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => {
    return (
      <View style={styles.optionCardContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionCard,
              {
                backgroundColor: selectedValue === option ? theme.primary : theme.card,
                borderColor: selectedValue === option ? theme.primary : theme.textSecondary + '40',
              },
            ]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionCardText,
                {
                  color: selectedValue === option ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: selectedValue === option ? '600' : '500',
                },
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const selectedPersonaId = preferences.therapist_persona_id || 'dr-elias';
  const selectedPersona = getPersonaById(selectedPersonaId);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* FIXED: Added pointerEvents="none" to decorative gradient */}
      <LinearGradient
        colors={theme.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
        pointerEvents="none"
      />

      {/* FIXED: SafeAreaView with pointerEvents="box-none" to allow touches through */}
      <SafeAreaView style={styles.safeArea} edges={['top']} pointerEvents="box-none">
        {/* FIXED: Header container with pointerEvents="box-none" */}
        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={handleInfoPress} style={styles.infoButton} activeOpacity={0.7}>
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* FIXED: ScrollView with pointerEvents="auto" to ensure content is tappable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        pointerEvents="auto"
      >
        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Theme</Text>
          <View style={styles.themeGrid}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeKey === 'ocean-blue' && styles.themeOptionSelected,
                { borderColor: themeKey === 'ocean-blue' ? theme.primary : 'transparent' },
              ]}
              onPress={() => handleThemeSelect('ocean-blue')}
              activeOpacity={0.7}
            >
              <View style={[styles.themePreview, { backgroundColor: '#4A90E2' }]} />
              <Text style={[styles.themeLabel, { color: theme.textPrimary }]}>Ocean Blue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeKey === 'soft-rose' && styles.themeOptionSelected,
                { borderColor: themeKey === 'soft-rose' ? theme.primary : 'transparent' },
              ]}
              onPress={() => handleThemeSelect('soft-rose')}
              activeOpacity={0.7}
            >
              <View style={[styles.themePreview, { backgroundColor: '#E57373' }]} />
              <Text style={[styles.themeLabel, { color: theme.textPrimary }]}>Soft Rose</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeKey === 'forest-green' && styles.themeOptionSelected,
                { borderColor: themeKey === 'forest-green' ? theme.primary : 'transparent' },
              ]}
              onPress={() => handleThemeSelect('forest-green')}
              activeOpacity={0.7}
            >
              <View style={[styles.themePreview, { backgroundColor: '#66BB6A' }]} />
              <Text style={[styles.themeLabel, { color: theme.textPrimary }]}>Forest Green</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Communication Style Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Communication Style
            </Text>
            <TouchableOpacity onPress={handleOpenPersonaModal} activeOpacity={0.7}>
              <Text style={[styles.changeButton, { color: theme.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>
          {selectedPersona && renderPersonaCard(selectedPersonaId)}
        </View>

        {/* Personalization Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Personalization
            </Text>
            <TouchableOpacity onPress={handleOpenPersonalizationInfoModal} activeOpacity={0.7}>
              <IconSymbol
                ios_icon_name="questionmark.circle"
                android_material_icon_name="help"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleOpenPersonalizationModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={theme.primary}
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: theme.textPrimary }]}>
                Edit Preferences
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleOpenUpdatesModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={20}
                color={theme.primary}
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: theme.textPrimary }]}>
                Updates Over Time
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleOpenClearPersonalizationModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={20}
                color="#FF3B30"
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: '#FF3B30' }]}>
                Clear Personalization
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Account</Text>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleOpenChangePasswordModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={theme.primary}
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: theme.textPrimary }]}>
                Change Password
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="arrow.right.square.fill"
                android_material_icon_name="logout"
                size={20}
                color={theme.primary}
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: theme.textPrimary }]}>
                Sign Out
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={20}
                color="#FF3B30"
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: '#FF3B30' }]}>
                Delete Account
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Support</Text>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleSupportPress}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={20}
                color={theme.primary}
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: theme.textPrimary }]}>
                Contact Support
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handlePrivacyPress}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="privacy_tip"
                size={20}
                color={theme.primary}
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: theme.textPrimary }]}>
                Privacy Policy
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleTermsPress}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={20}
                color={theme.primary}
                style={styles.settingsRowIcon}
              />
              <Text style={[styles.settingsRowText, { color: theme.textPrimary }]}>
                Terms of Service
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
            Safe Space v1.0.0
          </Text>
          <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
            Made with ❤️ for your wellbeing
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <InfoModal visible={showInfoModal} onClose={handleCloseInfoModal} />

      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={handleCancelDelete}
        userId={currentUser?.id || null}
        onSuccess={handleConfirmDelete}
      />

      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={handleCloseChangePasswordModal}
        onSave={handleSavePassword}
      />

      <TherapistPersonaModal
        visible={showPersonaModal}
        onClose={handleClosePersonaModal}
        onSave={handleSavePersona}
        onPreview={handleOpenPreview}
        currentPersonaId={selectedPersonaId}
      />

      <PersonalizationInfoModal
        visible={showPersonalizationInfoModal}
        onClose={handleClosePersonalizationInfoModal}
      />

      <ClearPersonalizationModal
        visible={showClearPersonalizationModal}
        onClose={handleCloseClearPersonalizationModal}
        onConfirm={handleConfirmClearPersonalization}
      />

      <PersonalizationModal
        visible={showPersonalizationModal}
        onClose={handleClosePersonalizationModal}
        onSave={handleSavePersonalization}
        conversationStyle={conversationStyle}
        setConversationStyle={setConversationStyle}
        stressResponse={stressResponse}
        setStressResponse={setStressResponse}
        processingStyle={processingStyle}
        setProcessingStyle={setProcessingStyle}
        decisionStyle={decisionStyle}
        setDecisionStyle={setDecisionStyle}
        aiPreference={aiPreference}
        setAiPreference={setAiPreference}
        conversationStyles={CONVERSATION_STYLES}
        stressResponses={STRESS_RESPONSES}
        processingStyles={PROCESSING_STYLES}
        decisionStyles={DECISION_STYLES}
        aiPreferenceOptions={AI_PREFERENCE_OPTIONS}
      />

      <UpdatesOverTimeModal
        visible={showUpdatesModal}
        onClose={handleCloseUpdatesModal}
        onAddUpdate={handleOpenAddUpdateModal}
        updates={updates}
        loadingUpdates={loadingUpdates}
        onEditUpdate={handleOpenEditUpdateModal}
        onDeleteUpdate={handleDeleteUpdate}
        expandedUpdateIds={expandedUpdateIds}
        toggleUpdateExpanded={toggleUpdateExpanded}
        formatDate={formatDate}
        formatRelativeDate={formatRelativeDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  safeArea: {
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5%',
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
    marginTop: 100,
  },
  content: {
    paddingHorizontal: '5%',
    paddingTop: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  changeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  themeOptionSelected: {
    borderWidth: 2,
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  personaAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  personaDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsRowIcon: {
    marginRight: 12,
  },
  settingsRowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionCardContainer: {
    gap: 8,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionCardText: {
    fontSize: 16,
    textAlign: 'center',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
