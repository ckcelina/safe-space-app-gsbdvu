
import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { IconSymbol } from '@/components/IconSymbol';
import { WidgetPreviewCard } from '@/components/ui/WidgetPreviewCard';
import { deleteUserAccount } from '@/utils/accountDeletion';
import { openSupportEmail } from '@/utils/supportHelpers';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { supabase } from '@/lib/supabase';
import { AI_TONES, getToneById } from '@/constants/AITones';
import { THERAPIST_PERSONAS, getPersonaById } from '@/constants/TherapistPersonas';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Primary tones (visible by default)
const PRIMARY_TONE_IDS = [
  'warm_hug',
  'balanced_blend',
  'mirror_mode',
  'calm_direct',
  'reality_check',
  'accountability_partner',
];

// Advanced tones (collapsed by default)
const ADVANCED_TONE_IDS = [
  'systems_thinker',
  'attachment_aware',
  'cognitive_clarity',
  'conflict_mediator',
  'tough_love',
  'straight_shooter',
  'executive_summary',
  'no_nonsense',
  'pattern_breaker',
  'boundary_enforcer',
  'detective',
  'therapy_room',
  'nurturing_parent',
  'best_friend',
  'soft_truth',
];

// Personalization options
const CONVERSATION_STYLES = [
  'Calm & grounding',
  'Direct & practical',
  'Gentle & supportive',
  'Curious & reflective',
];

const STRESS_RESPONSES = [
  'Reassurance',
  'Clear steps and structure',
  'Space to think',
  'Validation and empathy',
];

const PROCESSING_STYLES = [
  'Internally first',
  'Talking helps me process',
  'Logic first, feelings later',
  'Slowly over time',
];

const DECISION_STYLES = [
  'Fast and decisive',
  'I weigh pros/cons carefully',
  'I need time and reflection',
  'I prefer guidance and options',
];

// AI Preference options for Updates Over Time
const AI_PREFERENCE_OPTIONS = [
  'Be more gentle',
  'Be more direct',
  'Ask more questions',
  'Give shorter responses',
  'Give more structure/steps',
];

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

export default function SettingsScreen() {
  const { email, role, userId, signOut } = useAuth();
  const { themeKey, theme, setTheme } = useThemeContext();
  const { preferences, updatePreferences } = useUserPreferences();
  const insets = useSafeAreaInsets();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(themeKey);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Therapist Persona Modal State (NEW)
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState(preferences.therapist_persona_id || '');
  const [isUpdatingPersona, setIsUpdatingPersona] = useState(false);

  // AI Preferences Modal State
  const [showAIPreferencesModal, setShowAIPreferencesModal] = useState(false);
  const [selectedToneId, setSelectedToneId] = useState(preferences.ai_tone_id);
  const [scienceMode, setScienceMode] = useState(preferences.ai_science_mode);
  const [isUpdatingAIPrefs, setIsUpdatingAIPrefs] = useState(false);
  const [showAdvancedStyles, setShowAdvancedStyles] = useState(false);

  // Personalization Modal State
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [showPersonalizationInfoModal, setShowPersonalizationInfoModal] = useState(false);
  const [showClearPersonalizationModal, setShowClearPersonalizationModal] = useState(false);
  const [isUpdatingPersonalization, setIsUpdatingPersonalization] = useState(false);
  const [isClearingPersonalization, setIsClearingPersonalization] = useState(false);
  
  // Personalization form state
  const [conversationStyle, setConversationStyle] = useState(preferences.conversation_style || '');
  const [stressResponse, setStressResponse] = useState(preferences.stress_response || '');
  const [processingStyle, setProcessingStyle] = useState(preferences.processing_style || '');
  const [decisionStyle, setDecisionStyle] = useState(preferences.decision_style || '');
  const [culturalContext, setCulturalContext] = useState(preferences.cultural_context || '');
  const [valuesBoundaries, setValuesBoundaries] = useState(preferences.values_boundaries || '');
  const [recentChanges, setRecentChanges] = useState(preferences.recent_changes || '');

  // Updates Over Time State
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false);
  const [updates, setUpdates] = useState<PersonalizationUpdate[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<PersonalizationUpdate | null>(null);
  
  // Add/Edit Update Form State
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDetails, setUpdateDetails] = useState('');
  const [updateStartedAt, setUpdateStartedAt] = useState('');
  const [updateAiPreference, setUpdateAiPreference] = useState('');
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setSelectedTheme(themeKey);
  }, [themeKey]);

  // Sync AI preferences when they change
  useEffect(() => {
    setSelectedToneId(preferences.ai_tone_id);
    setScienceMode(preferences.ai_science_mode);
    setSelectedPersonaId(preferences.therapist_persona_id || '');
  }, [preferences]);

  // Sync personalization preferences when they change
  useEffect(() => {
    setConversationStyle(preferences.conversation_style || '');
    setStressResponse(preferences.stress_response || '');
    setProcessingStyle(preferences.processing_style || '');
    setDecisionStyle(preferences.decision_style || '');
    setCulturalContext(preferences.cultural_context || '');
    setValuesBoundaries(preferences.values_boundaries || '');
    setRecentChanges(preferences.recent_changes || '');
  }, [preferences]);

  const themes: { key: ThemeKey; name: string }[] = [
    { key: 'OceanBlue', name: 'Ocean Blue' },
    { key: 'SoftRose', name: 'Soft Rose' },
    { key: 'ForestGreen', name: 'Forest Green' },
    { key: 'SunnyYellow', name: 'Sunny Yellow' },
  ];

  const handleThemeSelect = async (themeKey: ThemeKey) => {
    setSelectedTheme(themeKey);
    await setTheme(themeKey);
    showSuccessToast('Theme updated!');
  };

  const handleLogout = async () => {
    console.log('[Settings] Logout button pressed');
    
    try {
      console.log('[Settings] Starting sign out...');
      
      await signOut();
      
      console.log('[Settings] Sign out successful, navigating to onboarding');
      
      setTimeout(() => {
        router.replace('/onboarding');
      }, 100);
    } catch (error) {
      console.error('[Settings] signOut error:', error);
      showErrorToast("Couldn't log out. Please try again.");
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/(home)');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!userId) {
      showErrorToast('User ID not found');
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
        showErrorToast('Something went wrong. Please try again.');
      }
    } catch (error: any) {
      console.error('[Settings] Unexpected error deleting account:', error);
      setShowDeleteModal(false);
      showErrorToast('Something went wrong. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSupportPress = async () => {
    try {
      await openSupportEmail();
    } catch (error) {
      console.error('[Settings] Error opening support email:', error);
      showErrorToast('Could not open email app');
    }
  };

  const handlePrivacyPress = async () => {
    try {
      const url = 'https://www.byceli.com/privacy-policy';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('[Settings] Cannot open URL:', url);
        showErrorToast('Could not open link');
      }
    } catch (error) {
      console.error('[Settings] Error opening privacy policy:', error);
      showErrorToast('Could not open link');
    }
  };

  const handleTermsPress = async () => {
    try {
      const url = 'https://www.byceli.com/terms-conditions';
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('[Settings] Cannot open URL:', url);
        showErrorToast('Could not open link');
      }
    } catch (error) {
      console.error('[Settings] Error opening terms and conditions:', error);
      showErrorToast('Could not open link');
    }
  };

  const handleInfoPress = () => {
    setShowInfoModal(true);
  };

  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
  };

  // Change Password Handlers
  const handleOpenChangePasswordModal = () => {
    setShowChangePasswordModal(true);
  };

  const handleCloseChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePassword = async () => {
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

    setIsUpdatingPassword(true);

    try {
      console.log('[Settings] Updating password...');
      
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error('[Settings] Password update error:', error);
        showErrorToast(error.message || 'Failed to update password');
        setIsUpdatingPassword(false);
        return;
      }

      console.log('[Settings] Password updated successfully');
      showSuccessToast('Password updated');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);
    } catch (error: any) {
      console.error('[Settings] Unexpected error updating password:', error);
      showErrorToast('Something went wrong. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Therapist Persona Handlers (NEW)
  const handleOpenPersonaModal = () => {
    setShowPersonaModal(true);
  };

  const handleClosePersonaModal = () => {
    setShowPersonaModal(false);
    setSelectedPersonaId(preferences.therapist_persona_id || '');
  };

  const handleSavePersona = async () => {
    setIsUpdatingPersona(true);

    const result = await updatePreferences({
      therapist_persona_id: selectedPersonaId || null,
    });

    setIsUpdatingPersona(false);

    if (result.success) {
      showSuccessToast('Therapist persona updated');
      setShowPersonaModal(false);
    } else {
      showErrorToast(result.error || 'Failed to update persona');
    }
  };

  // AI Preferences Handlers
  const handleOpenAIPreferencesModal = () => {
    setShowAIPreferencesModal(true);
    setShowAdvancedStyles(false);
  };

  const handleCloseAIPreferencesModal = () => {
    setShowAIPreferencesModal(false);
    setShowAdvancedStyles(false);
    setSelectedToneId(preferences.ai_tone_id);
    setScienceMode(preferences.ai_science_mode);
  };

  const handleSaveAIPreferences = async () => {
    setIsUpdatingAIPrefs(true);

    const result = await updatePreferences({
      ai_tone_id: selectedToneId,
      ai_science_mode: scienceMode,
    });

    setIsUpdatingAIPrefs(false);

    if (result.success) {
      showSuccessToast('AI preferences updated');
      setShowAIPreferencesModal(false);
      setShowAdvancedStyles(false);
    } else {
      showErrorToast(result.error || 'Failed to update preferences');
    }
  };

  // Personalization Handlers
  const handleOpenPersonalizationModal = () => {
    setShowPersonalizationModal(true);
  };

  const handleClosePersonalizationModal = () => {
    setShowPersonalizationModal(false);
    // Reset to current saved values
    setConversationStyle(preferences.conversation_style || '');
    setStressResponse(preferences.stress_response || '');
    setProcessingStyle(preferences.processing_style || '');
    setDecisionStyle(preferences.decision_style || '');
    setCulturalContext(preferences.cultural_context || '');
    setValuesBoundaries(preferences.values_boundaries || '');
    setRecentChanges(preferences.recent_changes || '');
  };

  const handleSavePersonalization = async () => {
    setIsUpdatingPersonalization(true);

    const result = await updatePreferences({
      conversation_style: conversationStyle || null,
      stress_response: stressResponse || null,
      processing_style: processingStyle || null,
      decision_style: decisionStyle || null,
      cultural_context: culturalContext || null,
      values_boundaries: valuesBoundaries || null,
      recent_changes: recentChanges || null,
    });

    setIsUpdatingPersonalization(false);

    if (result.success) {
      showSuccessToast('Personalization saved');
      setShowPersonalizationModal(false);
    } else {
      showErrorToast(result.error || 'Failed to save personalization');
    }
  };

  const handleOpenClearPersonalizationModal = () => {
    setShowClearPersonalizationModal(true);
  };

  const handleCloseClearPersonalizationModal = () => {
    setShowClearPersonalizationModal(false);
  };

  const handleConfirmClearPersonalization = async () => {
    setIsClearingPersonalization(true);

    const result = await updatePreferences({
      conversation_style: null,
      stress_response: null,
      processing_style: null,
      decision_style: null,
      cultural_context: null,
      values_boundaries: null,
      recent_changes: null,
    });

    setIsClearingPersonalization(false);

    if (result.success) {
      showSuccessToast('Personalization cleared');
      setShowClearPersonalizationModal(false);
      setShowPersonalizationModal(false);
      // Reset local state
      setConversationStyle('');
      setStressResponse('');
      setProcessingStyle('');
      setDecisionStyle('');
      setCulturalContext('');
      setValuesBoundaries('');
      setRecentChanges('');
    } else {
      showErrorToast(result.error || 'Failed to clear personalization');
    }
  };

  const handleOpenPersonalizationInfoModal = () => {
    setShowPersonalizationInfoModal(true);
  };

  const handleClosePersonalizationInfoModal = () => {
    setShowPersonalizationInfoModal(false);
  };

  // Updates Over Time Handlers
  const fetchUpdates = async () => {
    if (!userId) return;

    setIsLoadingUpdates(true);
    try {
      const { data, error } = await supabase
        .from('user_personalization_updates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Settings] Error fetching updates:', error);
        showErrorToast('Failed to load updates');
      } else {
        setUpdates(data || []);
      }
    } catch (error) {
      console.error('[Settings] Exception fetching updates:', error);
      showErrorToast('Failed to load updates');
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  const handleOpenUpdatesModal = async () => {
    setShowUpdatesModal(true);
    await fetchUpdates();
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

  const handleSaveUpdate = async () => {
    if (!userId) {
      showErrorToast('User ID not found');
      return;
    }

    if (!updateTitle.trim()) {
      showErrorToast('Please enter what changed');
      return;
    }

    setIsSavingUpdate(true);

    try {
      const updateData = {
        user_id: userId,
        title: updateTitle.trim(),
        details: updateDetails.trim() || null,
        started_at: updateStartedAt || null,
        ai_preference: updateAiPreference || null,
        updated_at: new Date().toISOString(),
      };

      if (editingUpdate) {
        // Update existing
        const { error } = await supabase
          .from('user_personalization_updates')
          .update(updateData)
          .eq('id', editingUpdate.id);

        if (error) {
          console.error('[Settings] Error updating update:', error);
          showErrorToast('Failed to save update');
        } else {
          showSuccessToast('Update saved');
          handleCloseAddUpdateModal();
          await fetchUpdates();
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_personalization_updates')
          .insert([updateData]);

        if (error) {
          console.error('[Settings] Error creating update:', error);
          showErrorToast('Failed to save update');
        } else {
          showSuccessToast('Update added');
          handleCloseAddUpdateModal();
          await fetchUpdates();
        }
      }
    } catch (error) {
      console.error('[Settings] Exception saving update:', error);
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
                .from('user_personalization_updates')
                .delete()
                .eq('id', updateId);

              if (error) {
                console.error('[Settings] Error deleting update:', error);
                showErrorToast('Failed to delete update');
              } else {
                showSuccessToast('Update deleted');
                await fetchUpdates();
              }
            } catch (error) {
              console.error('[Settings] Exception deleting update:', error);
              showErrorToast('Failed to delete update');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderToneCard = (toneId: string) => {
    const tone = getToneById(toneId);
    if (!tone) return null;

    return (
      <TouchableOpacity
        key={tone.toneId}
        style={[
          styles.aiToneCard,
          {
            backgroundColor: selectedToneId === tone.toneId ? theme.primary + '15' : theme.background,
            borderColor: selectedToneId === tone.toneId ? theme.primary : theme.textSecondary + '30',
          },
        ]}
        onPress={() => setSelectedToneId(tone.toneId)}
        activeOpacity={0.7}
      >
        <View style={styles.aiToneCardHeader}>
          <Text
            style={[
              styles.aiToneName,
              {
                color: selectedToneId === tone.toneId ? theme.primary : theme.textPrimary,
                fontWeight: selectedToneId === tone.toneId ? '700' : '600',
              },
            ]}
          >
            {tone.displayName}
          </Text>
          {selectedToneId === tone.toneId && (
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check_circle"
              size={18}
              color={theme.primary}
            />
          )}
        </View>
        <Text style={[styles.aiToneDescription, { color: theme.textSecondary }]}>
          {tone.shortDescription}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPersonaCard = (personaId: string) => {
    const persona = getPersonaById(personaId);
    if (!persona) return null;

    return (
      <TouchableOpacity
        key={persona.id}
        style={[
          styles.personaCard,
          {
            backgroundColor: selectedPersonaId === persona.id ? theme.primary + '15' : theme.background,
            borderColor: selectedPersonaId === persona.id ? theme.primary : theme.textSecondary + '30',
          },
        ]}
        onPress={() => setSelectedPersonaId(persona.id)}
        activeOpacity={0.7}
      >
        <Image
          source={persona.image}
          style={styles.personaImage}
          resizeMode="cover"
        />
        <View style={styles.personaCardContent}>
          <View style={styles.personaCardHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.personaName,
                  {
                    color: selectedPersonaId === persona.id ? theme.primary : theme.textPrimary,
                    fontWeight: selectedPersonaId === persona.id ? '700' : '600',
                  },
                ]}
              >
                {persona.name}
              </Text>
              <Text
                style={[
                  styles.personaLabel,
                  {
                    color: selectedPersonaId === persona.id ? theme.primary : theme.textSecondary,
                  },
                ]}
              >
                {persona.label}
              </Text>
            </View>
            {selectedPersonaId === persona.id && (
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={theme.primary}
              />
            )}
          </View>
          <Text style={[styles.personaDescription, { color: theme.textSecondary }]}>
            {persona.long_description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOptionCard = (
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => {
    return (
      <View style={styles.optionCardsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionCard,
              {
                backgroundColor: selectedValue === option ? theme.primary + '15' : theme.background,
                borderColor: selectedValue === option ? theme.primary : theme.textSecondary + '30',
              },
            ]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <View style={styles.optionCardContent}>
              <Text
                style={[
                  styles.optionCardText,
                  {
                    color: selectedValue === option ? theme.primary : theme.textPrimary,
                    fontWeight: selectedValue === option ? '600' : '500',
                  },
                ]}
              >
                {option}
              </Text>
              {selectedValue === option && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={18}
                  color={theme.primary}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const hasPersonalizationData = 
    preferences.conversation_style ||
    preferences.stress_response ||
    preferences.processing_style ||
    preferences.decision_style ||
    preferences.cultural_context ||
    preferences.values_boundaries ||
    preferences.recent_changes;

  const selectedPersona = getPersonaById(preferences.therapist_persona_id || '');

  return (
    <>
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.container}>
            {/* Header with Back Button on LEFT and Info Icon on RIGHT */}
            <View style={styles.topHeader}>
              <TouchableOpacity 
                onPress={handleBack} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow_back"
                  size={24}
                  color={theme.buttonText}
                />
              </TouchableOpacity>
              
              <View style={styles.headerSpacer} />
              
              <TouchableOpacity 
                onPress={handleInfoPress} 
                style={styles.infoButton}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="info.circle"
                  android_material_icon_name="info"
                  size={24}
                  color={theme.buttonText}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 60 + insets.bottom + 16 }
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.buttonText }]}>
                  Settings
                </Text>
                <Text style={[styles.subtitle, { color: theme.buttonText, opacity: 0.9 }]}>
                  Your account & preferences
                </Text>
              </View>

              {/* Card 1: Account */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Account
                </Text>

                {/* Email Row */}
                <View style={[styles.row, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                    Email
                  </Text>
                  <Text style={[styles.rowValue, { color: theme.textPrimary }]} numberOfLines={1}>
                    {email || 'Not available'}
                  </Text>
                </View>
              </View>

              {/* Card 2: Account information */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Account information
                </Text>

                <TouchableOpacity
                  style={[styles.row, { borderBottomWidth: 0 }]}
                  onPress={handleOpenChangePasswordModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="lock.fill"
                      android_material_icon_name="lock"
                      size={20}
                      color={theme.primary}
                    />
                    <Text style={[styles.rowLabel, { color: theme.textPrimary, marginLeft: 12 }]}>
                      Change password
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Card 2.5: AI Style Preferences */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  AI Style Preferences
                </Text>

                {/* Therapist Persona (NEW) */}
                <TouchableOpacity
                  style={[styles.row, { borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}
                  onPress={handleOpenPersonaModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="person.circle.fill"
                      android_material_icon_name="account_circle"
                      size={20}
                      color={theme.primary}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                        Therapist Persona
                      </Text>
                      <Text style={[styles.rowSubtext, { color: theme.textSecondary }]}>
                        {selectedPersona ? selectedPersona.name : 'Not selected'}
                      </Text>
                    </View>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.row, { borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}
                  onPress={handleOpenAIPreferencesModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="wand.and.stars"
                      android_material_icon_name="auto_awesome"
                      size={20}
                      color={theme.primary}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                        AI Tone
                      </Text>
                      <Text style={[styles.rowSubtext, { color: theme.textSecondary }]}>
                        {getToneById(preferences.ai_tone_id)?.displayName || 'Balanced Blend'}
                      </Text>
                    </View>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                <View style={[styles.row, { borderBottomWidth: 0, paddingVertical: 16 }]}>
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="book.fill"
                      android_material_icon_name="menu_book"
                      size={20}
                      color={theme.primary}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                        Science & Resources Mode
                      </Text>
                      <Text style={[styles.rowSubtext, { color: theme.textSecondary }]}>
                        Include psychology insights
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={preferences.ai_science_mode}
                    onValueChange={async (value) => {
                      const result = await updatePreferences({ ai_science_mode: value });
                      if (result.success) {
                        showSuccessToast(value ? 'Science mode enabled' : 'Science mode disabled');
                      } else {
                        showErrorToast('Failed to update');
                      }
                    }}
                    trackColor={{ false: theme.textSecondary + '40', true: theme.primary + '60' }}
                    thumbColor={preferences.ai_science_mode ? theme.primary : '#f4f3f4'}
                    ios_backgroundColor={theme.textSecondary + '40'}
                  />
                </View>
              </View>

              {/* Card 2.6: Personalization (Optional) */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Personalization (Optional)
                  </Text>
                  <TouchableOpacity
                    onPress={handleOpenPersonalizationInfoModal}
                    activeOpacity={0.7}
                    style={styles.whyWeAskButton}
                  >
                    <Text style={[styles.whyWeAskText, { color: theme.primary }]}>
                      Why we ask
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                  Share what helps conversations feel natural for you. You can change or remove this anytime.
                </Text>

                <TouchableOpacity
                  style={[styles.row, { borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)', marginTop: 8 }]}
                  onPress={handleOpenPersonalizationModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="person.fill"
                      android_material_icon_name="person"
                      size={20}
                      color={theme.primary}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                        Personalization settings
                      </Text>
                      <Text style={[styles.rowSubtext, { color: theme.textSecondary }]}>
                        {hasPersonalizationData ? 'Configured' : 'Not set'}
                      </Text>
                    </View>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                {/* Updates Over Time Section */}
                <TouchableOpacity
                  style={[styles.row, { borderBottomWidth: 0, marginTop: 0 }]}
                  onPress={handleOpenUpdatesModal}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={20}
                      color={theme.primary}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
                        Updates Over Time
                      </Text>
                      <Text style={[styles.rowSubtext, { color: theme.textSecondary }]}>
                        {updates.length > 0 ? `${updates.length} update${updates.length !== 1 ? 's' : ''}` : 'No updates yet'}
                      </Text>
                    </View>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Card 3: Appearance */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Appearance
                </Text>

                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  Theme
                </Text>

                <View style={styles.pillContainer}>
                  {themes.map((themeOption, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pill,
                        {
                          backgroundColor:
                            selectedTheme === themeOption.key
                              ? theme.primary
                              : theme.background,
                          borderColor: selectedTheme === themeOption.key ? theme.primary : '#E0E0E0',
                        },
                      ]}
                      onPress={() => handleThemeSelect(themeOption.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color:
                              selectedTheme === themeOption.key
                                ? '#FFFFFF'
                                : theme.textPrimary,
                          },
                        ]}
                      >
                        {themeOption.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Widget Preview Card */}
              <WidgetPreviewCard />

              {/* Card 4: Support */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Support
                </Text>

                <TouchableOpacity
                  style={[styles.row, { borderBottomWidth: 0 }]}
                  onPress={handleSupportPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="envelope.fill"
                      android_material_icon_name="email"
                      size={20}
                      color={theme.primary}
                    />
                    <Text style={[styles.rowLabel, { color: theme.textPrimary, marginLeft: 12 }]}>
                      Contact Support
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Card 5: Legal */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Legal
                </Text>

                <TouchableOpacity
                  style={styles.row}
                  onPress={handlePrivacyPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="lock.shield.fill"
                      android_material_icon_name="shield"
                      size={20}
                      color={theme.primary}
                    />
                    <Text style={[styles.rowLabel, { color: theme.textPrimary, marginLeft: 12 }]}>
                      Privacy Policy
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.row, { borderBottomWidth: 0 }]}
                  onPress={handleTermsPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="doc.text.fill"
                      android_material_icon_name="description"
                      size={20}
                      color={theme.primary}
                    />
                    <Text style={[styles.rowLabel, { color: theme.textPrimary, marginLeft: 12 }]}>
                      Terms and Conditions
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Log Out Button */}
              <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: '#FF6B6B' }]}
                onPress={handleSignOut}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="arrow.right.square.fill"
                  android_material_icon_name="logout"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>

              {/* Account Deletion Section */}
              <View style={styles.accountSection}>
                <Text style={[styles.sectionTitle, { color: theme.buttonText }]}>
                  Account
                </Text>
                <View style={[styles.dangerCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteAccount}
                    activeOpacity={0.8}
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.deleteButtonText}>Delete My Account</Text>
                  </TouchableOpacity>
                  <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                    This will permanently remove your profile and conversations.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseInfoModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
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

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleCloseInfoModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
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
              <TouchableOpacity
                style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                onPress={handleCancelDelete}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButtonHalf, styles.confirmDeleteButton]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseChangePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
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
                  editable={!isUpdatingPassword}
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
                  editable={!isUpdatingPassword}
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
                  editable={!isUpdatingPassword}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                  onPress={handleCloseChangePasswordModal}
                  disabled={isUpdatingPassword}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButtonHalf, { backgroundColor: theme.primary }]}
                  onPress={handleSavePassword}
                  disabled={isUpdatingPassword}
                  activeOpacity={0.8}
                >
                  {isUpdatingPassword ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Therapist Persona Modal (NEW) */}
      <Modal
        visible={showPersonaModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePersonaModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={[styles.modalContent, { backgroundColor: '#FFFFFF', maxHeight: SCREEN_HEIGHT * 0.85 }]}>
              <View style={styles.modalIconContainer}>
                <IconSymbol
                  ios_icon_name="person.circle.fill"
                  android_material_icon_name="account_circle"
                  size={48}
                  color={theme.primary}
                />
              </View>

              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Therapist Persona
              </Text>

              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                Choose a therapist persona to guide the conversational style. This is purely for tone and pacing, not medical care.
              </Text>

              <ScrollView 
                style={styles.personaScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {THERAPIST_PERSONAS.map((persona) => renderPersonaCard(persona.id))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                  onPress={handleClosePersonaModal}
                  disabled={isUpdatingPersona}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButtonHalf, { backgroundColor: theme.primary }]}
                  onPress={handleSavePersona}
                  disabled={isUpdatingPersona}
                  activeOpacity={0.8}
                >
                  {isUpdatingPersona ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* AI Preferences Modal */}
      <Modal
        visible={showAIPreferencesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAIPreferencesModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={[styles.modalContent, { backgroundColor: '#FFFFFF', maxHeight: SCREEN_HEIGHT * 0.85 }]}>
              <View style={styles.modalIconContainer}>
                <IconSymbol
                  ios_icon_name="wand.and.stars"
                  android_material_icon_name="auto_awesome"
                  size={48}
                  color={theme.primary}
                />
              </View>

              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                AI Style Preferences
              </Text>

              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                Choose how Safe Space communicates with you
              </Text>

              <ScrollView 
                style={styles.aiPrefsScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={[styles.aiPrefsSectionTitle, { color: theme.textPrimary }]}>
                  AI Tone
                </Text>
                
                {PRIMARY_TONE_IDS.map((toneId) => renderToneCard(toneId))}

                <TouchableOpacity
                  style={[
                    styles.advancedStylesToggle,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.textSecondary + '30',
                    },
                  ]}
                  onPress={() => setShowAdvancedStyles(!showAdvancedStyles)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.advancedStylesText, { color: theme.textPrimary }]}>
                    Advanced Styles
                  </Text>
                  <IconSymbol
                    ios_icon_name={showAdvancedStyles ? 'chevron.up' : 'chevron.down'}
                    android_material_icon_name={showAdvancedStyles ? 'expand_less' : 'expand_more'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                {showAdvancedStyles && (
                  <View style={styles.advancedStylesContainer}>
                    {ADVANCED_TONE_IDS.map((toneId) => renderToneCard(toneId))}
                  </View>
                )}

                <View style={styles.aiScienceModeContainer}>
                  <Text style={[styles.aiPrefsSectionTitle, { color: theme.textPrimary }]}>
                    Science & Resources
                  </Text>
                  <View style={styles.aiScienceModeRow}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={[styles.aiScienceModeText, { color: theme.textPrimary }]}>
                        Include psychology insights and suggested reading
                      </Text>
                    </View>
                    <Switch
                      value={scienceMode}
                      onValueChange={setScienceMode}
                      trackColor={{ false: theme.textSecondary + '40', true: theme.primary + '60' }}
                      thumbColor={scienceMode ? theme.primary : '#f4f3f4'}
                      ios_backgroundColor={theme.textSecondary + '40'}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                  onPress={handleCloseAIPreferencesModal}
                  disabled={isUpdatingAIPrefs}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButtonHalf, { backgroundColor: theme.primary }]}
                  onPress={handleSaveAIPreferences}
                  disabled={isUpdatingAIPrefs}
                  activeOpacity={0.8}
                >
                  {isUpdatingAIPrefs ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Personalization Info Modal */}
      <Modal
        visible={showPersonalizationInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePersonalizationInfoModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.modalIconContainer}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={48}
                color={theme.primary}
              />
            </View>

            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Why Personalization?
            </Text>

            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              This helps the AI match your preferred tone, pacing, and examples. It does not diagnose or label you. You&apos;re always in control, and you can clear this anytime.
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleClosePersonalizationInfoModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clear Personalization Confirmation Modal */}
      <Modal
        visible={showClearPersonalizationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseClearPersonalizationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.modalIconContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={48}
                color="#FF9500"
              />
            </View>

            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Clear personalization?
            </Text>

            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              This removes the personalization details from your account. The AI will go back to default behavior.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                onPress={handleCloseClearPersonalizationModal}
                disabled={isClearingPersonalization}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButtonHalf, { backgroundColor: '#FF9500' }]}
                onPress={handleConfirmClearPersonalization}
                disabled={isClearingPersonalization}
                activeOpacity={0.8}
              >
                {isClearingPersonalization ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Clear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Personalization Modal */}
      <Modal
        visible={showPersonalizationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePersonalizationModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={[styles.personalizationModalContent, { backgroundColor: '#FFFFFF' }]}>
              <View style={styles.modalIconContainer}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={48}
                  color={theme.primary}
                />
              </View>

              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Personalization (Optional)
              </Text>

              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                Share what helps conversations feel natural for you. You can change or remove this anytime.
              </Text>

              <ScrollView 
                style={styles.personalizationScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {/* Preferred conversation style */}
                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                    Preferred conversation style
                  </Text>
                  <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                    Choose the tone that feels best to you.
                  </Text>
                  {renderOptionCard(CONVERSATION_STYLES, conversationStyle, setConversationStyle)}
                </View>

                {/* When you're stressed, what helps most? */}
                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                    When you&apos;re stressed, what helps most?
                  </Text>
                  <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                    This helps the AI respond in a way that feels more useful.
                  </Text>
                  {renderOptionCard(STRESS_RESPONSES, stressResponse, setStressResponse)}
                </View>

                {/* How do you prefer to process feelings? */}
                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                    How do you prefer to process feelings?
                  </Text>
                  <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                    Everyone processes differently — pick what fits you best.
                  </Text>
                  {renderOptionCard(PROCESSING_STYLES, processingStyle, setProcessingStyle)}
                </View>

                {/* Decision-making style */}
                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                    Decision-making style
                  </Text>
                  <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                    How do you usually prefer to decide?
                  </Text>
                  {renderOptionCard(DECISION_STYLES, decisionStyle, setDecisionStyle)}
                </View>

                {/* Cultural context (optional) */}
                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                    Cultural context (optional)
                  </Text>
                  <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                    Share anything that helps the AI understand your context.
                  </Text>
                  <TextInput
                    style={[
                      styles.multilineTextInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.textPrimary,
                        borderColor: theme.textSecondary + '30',
                      },
                    ]}
                    placeholder="Optional"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={3}
                    value={culturalContext}
                    onChangeText={setCulturalContext}
                    editable={!isUpdatingPersonalization}
                  />
                </View>

                {/* Values or boundaries (optional) */}
                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                    Values or boundaries (optional)
                  </Text>
                  <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                    Anything the AI should respect while responding?
                  </Text>
                  <TextInput
                    style={[
                      styles.multilineTextInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.textPrimary,
                        borderColor: theme.textSecondary + '30',
                      },
                    ]}
                    placeholder="Optional"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={3}
                    value={valuesBoundaries}
                    onChangeText={setValuesBoundaries}
                    editable={!isUpdatingPersonalization}
                  />
                </View>

                {/* Recent changes you've noticed (optional) */}
                <View style={styles.personalizationSection}>
                  <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                    Recent changes you&apos;ve noticed (optional)
                  </Text>
                  <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                    If something feels different lately, you can note it here.
                  </Text>
                  <TextInput
                    style={[
                      styles.multilineTextInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.textPrimary,
                        borderColor: theme.textSecondary + '30',
                      },
                    ]}
                    placeholder="Optional"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={3}
                    value={recentChanges}
                    onChangeText={setRecentChanges}
                    editable={!isUpdatingPersonalization}
                  />
                </View>

                {/* Privacy copy */}
                <Text style={[styles.personalizationPrivacyText, { color: theme.textSecondary }]}>
                  Personalization is optional. You can edit or clear it anytime.
                </Text>
              </ScrollView>

              {/* Buttons */}
              <View style={styles.personalizationButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary, marginBottom: 12 }]}
                  onPress={handleSavePersonalization}
                  disabled={isUpdatingPersonalization}
                  activeOpacity={0.8}
                >
                  {isUpdatingPersonalization ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save changes</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                    onPress={handleClosePersonalizationModal}
                    disabled={isUpdatingPersonalization}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButtonHalf, { backgroundColor: '#FF9500' }]}
                    onPress={handleOpenClearPersonalizationModal}
                    disabled={isUpdatingPersonalization}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Clear data</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Updates Over Time Modal */}
      <Modal
        visible={showUpdatesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseUpdatesModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.updatesModalContent, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.updatesModalHeader}>
              <TouchableOpacity
                onPress={handleCloseUpdatesModal}
                style={styles.updatesModalCloseButton}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
              <Text style={[styles.updatesModalTitle, { color: theme.textPrimary }]}>
                Updates Over Time
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <Text style={[styles.updatesModalDescription, { color: theme.textSecondary }]}>
              Add short updates so responses stay relevant to what you&apos;re experiencing.
            </Text>

            <TouchableOpacity
              style={[styles.addUpdateButton, { backgroundColor: theme.primary }]}
              onPress={handleOpenAddUpdateModal}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.addUpdateButtonText}>Add update</Text>
            </TouchableOpacity>

            <ScrollView
              style={styles.updatesListScrollView}
              contentContainerStyle={styles.updatesListContent}
              showsVerticalScrollIndicator={true}
            >
              {isLoadingUpdates ? (
                <View style={styles.updatesLoadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              ) : updates.length === 0 ? (
                <View style={styles.updatesEmptyContainer}>
                  <IconSymbol
                    ios_icon_name="clock"
                    android_material_icon_name="schedule"
                    size={48}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.updatesEmptyText, { color: theme.textSecondary }]}>
                    No updates yet
                  </Text>
                  <Text style={[styles.updatesEmptySubtext, { color: theme.textSecondary }]}>
                    Add your first update to help personalize your experience
                  </Text>
                </View>
              ) : (
                updates.map((update, index) => (
                  <View
                    key={index}
                    style={[
                      styles.updateCard,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.textSecondary + '20',
                      },
                    ]}
                  >
                    <View style={styles.updateCardHeader}>
                      <Text style={[styles.updateCardTitle, { color: theme.textPrimary }]}>
                        {update.title}
                      </Text>
                      {update.started_at && (
                        <Text style={[styles.updateCardDate, { color: theme.textSecondary }]}>
                          {formatDate(update.started_at)}
                        </Text>
                      )}
                    </View>

                    {update.details && (
                      <Text
                        style={[styles.updateCardDetails, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {update.details}
                      </Text>
                    )}

                    {update.ai_preference && (
                      <View style={[styles.updateCardPreference, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.updateCardPreferenceText, { color: theme.primary }]}>
                          {update.ai_preference}
                        </Text>
                      </View>
                    )}

                    <View style={styles.updateCardActions}>
                      <TouchableOpacity
                        style={styles.updateCardActionButton}
                        onPress={() => handleOpenEditUpdateModal(update)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol
                          ios_icon_name="pencil"
                          android_material_icon_name="edit"
                          size={18}
                          color={theme.primary}
                        />
                        <Text style={[styles.updateCardActionText, { color: theme.primary }]}>
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.updateCardActionButton}
                        onPress={() => handleDeleteUpdate(update.id)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol
                          ios_icon_name="trash"
                          android_material_icon_name="delete"
                          size={18}
                          color="#FF3B30"
                        />
                        <Text style={[styles.updateCardActionText, { color: '#FF3B30' }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add/Edit Update Modal */}
      <Modal
        visible={showAddUpdateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAddUpdateModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={[styles.addUpdateModalContent, { backgroundColor: '#FFFFFF' }]}>
              <View style={styles.modalIconContainer}>
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add_circle"
                  size={48}
                  color={theme.primary}
                />
              </View>

              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {editingUpdate ? 'Edit Update' : 'Add Update'}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  What changed? *
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
                  placeholder="e.g., Feeling more sensitive lately"
                  placeholderTextColor={theme.textSecondary}
                  value={updateTitle}
                  onChangeText={setUpdateTitle}
                  editable={!isSavingUpdate}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Details (optional)
                </Text>
                <TextInput
                  style={[
                    styles.multilineTextInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.textSecondary + '30',
                    },
                  ]}
                  placeholder="Add more context if helpful"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  value={updateDetails}
                  onChangeText={setUpdateDetails}
                  editable={!isSavingUpdate}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  When did this start? (optional)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.textSecondary + '30',
                    },
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  value={updateStartedAt}
                  onChangeText={setUpdateStartedAt}
                  editable={!isSavingUpdate}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  How should the AI respond differently? (optional)
                </Text>
                {renderOptionCard(AI_PREFERENCE_OPTIONS, updateAiPreference, setUpdateAiPreference)}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                  onPress={handleCloseAddUpdateModal}
                  disabled={isSavingUpdate}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButtonHalf, { backgroundColor: theme.primary }]}
                  onPress={handleSaveUpdate}
                  disabled={isSavingUpdate}
                  activeOpacity={0.8}
                >
                  {isSavingUpdate ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerSpacer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: '5%',
  },
  header: {
    marginBottom: Math.min(SCREEN_HEIGHT * 0.04, 32),
  },
  title: {
    fontSize: Math.min(SCREEN_WIDTH * 0.08, 32),
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: '5%',
    marginBottom: '5%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.05, 20),
    fontWeight: '700',
    marginBottom: '5%',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  whyWeAskButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  whyWeAskText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowLabel: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '500',
  },
  rowValue: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  rowSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  label: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '500',
    marginBottom: 12,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: '5%',
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountSection: {
    marginTop: '10%',
    marginBottom: '5%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    opacity: 0.9,
  },
  dangerCard: {
    borderRadius: 16,
    padding: '5%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: '6%',
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
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
  personalizationModalContent: {
    borderRadius: 20,
    padding: '6%',
    width: '100%',
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.9,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  addUpdateModalContent: {
    borderRadius: 20,
    padding: '6%',
    width: '100%',
    maxWidth: 500,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: '5%',
  },
  modalTitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.06, 24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
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
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '600',
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
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#FF3B30',
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    fontWeight: '600',
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
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    borderWidth: 1,
  },
  personaScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.5,
    marginBottom: 16,
  },
  personaCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  personaImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  personaCardContent: {
    flex: 1,
  },
  personaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  personaName: {
    fontSize: 18,
    marginBottom: 4,
  },
  personaLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  personaDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiPrefsScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.5,
    marginBottom: 16,
  },
  aiPrefsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 12,
  },
  aiToneCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  aiToneCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiToneName: {
    fontSize: 15,
    flex: 1,
  },
  aiToneDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  advancedStylesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 8,
    marginBottom: 10,
  },
  advancedStylesText: {
    fontSize: 15,
    fontWeight: '600',
  },
  advancedStylesContainer: {
    marginTop: 4,
  },
  aiScienceModeContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  aiScienceModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiScienceModeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  personalizationScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.55,
    marginBottom: 16,
  },
  personalizationSection: {
    marginBottom: 24,
  },
  personalizationFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  personalizationFieldHelper: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  optionCardsContainer: {
    gap: 8,
  },
  optionCard: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
  },
  optionCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionCardText: {
    fontSize: 14,
    flex: 1,
  },
  multilineTextInput: {
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  personalizationPrivacyText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  personalizationButtonsContainer: {
    marginTop: 8,
  },
  updatesModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.85,
    paddingTop: 16,
  },
  updatesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  updatesModalCloseButton: {
    padding: 8,
  },
  updatesModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  updatesModalDescription: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  addUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  addUpdateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  updatesListScrollView: {
    flex: 1,
  },
  updatesListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  updatesLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  updatesEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  updatesEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  updatesEmptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  updateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  updateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  updateCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  updateCardDate: {
    fontSize: 13,
  },
  updateCardDetails: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  updateCardPreference: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  updateCardPreferenceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  updateCardActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  updateCardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateCardActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
