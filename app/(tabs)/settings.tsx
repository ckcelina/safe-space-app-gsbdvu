
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
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
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
import { THERAPIST_PERSONAS, getPersonaById } from '@/constants/TherapistPersonas';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// Format date for display with relative dates
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export default function SettingsScreen() {
  const { email, role, userId, signOut } = useAuth();
  const { themeKey, theme, setTheme } = useThemeContext();
  const { preferences, updatePreferences } = useUserPreferences();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
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

  // Therapist Persona Modal State
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState(preferences.therapist_persona_id || '');
  const [isUpdatingPersona, setIsUpdatingPersona] = useState(false);
  


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
  const [expandedUpdateIds, setExpandedUpdateIds] = useState<Set<string>>(new Set());
  
  // Add/Edit Update Form State
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDetails, setUpdateDetails] = useState('');
  const [updateStartedAt, setUpdateStartedAt] = useState('');
  const [updateAiPreference, setUpdateAiPreference] = useState('');
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Responsive layout calculations
  const isCompactScreen = windowHeight < 700;
  const modalMaxWidth = Math.min(windowWidth * 0.92, 520);
  const actionBarHeight = 140; // Approximate height for action buttons area

  // DEFENSIVE DEBUG LOGGING: Detect modals mounted while marked closed
  useEffect(() => {
    if (__DEV__) {
      // Check if any modal backdrop is present in DOM while state says closed
      const modalStates = {
        showInfoModal,
        showDeleteModal,
        showChangePasswordModal,
        showPersonaModal,
        showPersonalizationInfoModal,
        showClearPersonalizationModal,
        showPersonalizationModal,
        showUpdatesModal,
        showAddUpdateModal,
      };

      const openModals = Object.entries(modalStates).filter(([_, isOpen]) => isOpen);
      
      if (openModals.length > 1) {
        console.warn(
          '[Settings] Multiple modals open simultaneously:',
          openModals.map(([name]) => name).join(', '),
          '- This may cause backdrop stacking issues'
        );
      }
    }
  }, [
    showInfoModal,
    showDeleteModal,
    showChangePasswordModal,
    showPersonaModal,
    showPersonalizationInfoModal,
    showClearPersonalizationModal,
    showPersonalizationModal,
    showUpdatesModal,
    showAddUpdateModal,
  ]);

  useEffect(() => {
    setSelectedTheme(themeKey);
  }, [themeKey]);

  // Sync preferences when they change
  useEffect(() => {
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

  // Therapist Persona Handlers
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
      showSuccessToast('Therapist updated');
      setShowPersonaModal(false);
    } else {
      showErrorToast(result.error || 'Failed to update therapist');
    }
  };

  // Preview Style Handlers
  const handleOpenPreview = (personaId: string) => {
    const persona = getPersonaById(personaId);
    if (!persona) {
      console.error('[Settings] Persona not found:', personaId);
      return;
    }

    // FIX: Close the modal first to prevent lingering backdrop
    setShowPersonaModal(false);

    // Small delay to allow modal close animation to complete before navigation
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/(home)/communication-style-preview',
        params: {
          therapistPersonaId: persona.id,
          therapistName: persona.name,
          styleLabel: persona.label,
          description: persona.short_description,
        },
      });
    }, 200);
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
    // FIX: Don't open nested modal - close parent first
    setShowPersonalizationModal(false);
    setTimeout(() => {
      setShowClearPersonalizationModal(true);
    }, 300);
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
    if (!userId) {
      console.log('[Settings] fetchUpdates: No userId available');
      return;
    }

    console.log('[Settings] fetchUpdates: Starting fetch for userId:', userId);
    setIsLoadingUpdates(true);
    
    try {
      const { data, error } = await supabase
        .from('user_personalization_updates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Settings] fetchUpdates: Error fetching updates:', error);
        if (__DEV__) {
          showErrorToast(`Failed to load updates: ${error.message}`);
        } else {
          showErrorToast('Failed to load updates');
        }
      } else {
        console.log('[Settings] fetchUpdates: Successfully fetched', data?.length || 0, 'updates');
        setUpdates(data || []);
      }
    } catch (error) {
      console.error('[Settings] fetchUpdates: Exception fetching updates:', error);
      if (__DEV__) {
        showErrorToast(`Exception: ${error}`);
      } else {
        showErrorToast('Failed to load updates');
      }
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  const handleOpenUpdatesModal = async () => {
    console.log('[Settings] handleOpenUpdatesModal: Opening Updates Over Time modal');
    setShowUpdatesModal(true);
    await fetchUpdates();
  };

  const handleCloseUpdatesModal = () => {
    console.log('[Settings] handleCloseUpdatesModal: Closing Updates Over Time modal');
    setShowUpdatesModal(false);
    setExpandedUpdateIds(new Set());
  };

  const handleOpenAddUpdateModal = () => {
    console.log('[Settings] handleOpenAddUpdateModal: Opening Add Update modal');
    setEditingUpdate(null);
    setUpdateTitle('');
    setUpdateDetails('');
    setUpdateStartedAt('');
    setUpdateAiPreference('');
    setValidationError('');
    setShowAddUpdateModal(true);
  };

  const handleOpenEditUpdateModal = (update: PersonalizationUpdate) => {
    console.log('[Settings] handleOpenEditUpdateModal: Opening Edit Update modal for update:', update.id);
    setEditingUpdate(update);
    setUpdateTitle(update.title);
    setUpdateDetails(update.details || '');
    setUpdateStartedAt(update.started_at || '');
    setUpdateAiPreference(update.ai_preference || '');
    setValidationError('');
    setShowAddUpdateModal(true);
  };

  const handleCloseAddUpdateModal = () => {
    console.log('[Settings] handleCloseAddUpdateModal: Closing Add/Edit Update modal');
    setShowAddUpdateModal(false);
    setEditingUpdate(null);
    setUpdateTitle('');
    setUpdateDetails('');
    setUpdateStartedAt('');
    setUpdateAiPreference('');
    setValidationError('');
  };

  const validateUpdateInput = (): boolean => {
    const trimmedTitle = updateTitle.trim();
    
    if (!trimmedTitle) {
      setValidationError('Please enter what changed');
      return false;
    }

    if (trimmedTitle.length < 1 || trimmedTitle.length > 500) {
      setValidationError('Update must be between 1 and 500 characters');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSaveUpdate = async () => {
    console.log('[Settings] handleSaveUpdate: Starting save process');
    
    if (!userId) {
      console.error('[Settings] handleSaveUpdate: No userId available');
      showErrorToast('User ID not found');
      return;
    }

    if (!validateUpdateInput()) {
      console.log('[Settings] handleSaveUpdate: Validation failed');
      return;
    }

    console.log('[Settings] handleSaveUpdate: Validation passed, proceeding with save');
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

      console.log('[Settings] handleSaveUpdate: Update data prepared:', updateData);

      if (editingUpdate) {
        // Update existing
        console.log('[Settings] handleSaveUpdate: Updating existing update:', editingUpdate.id);
        const { error } = await supabase
          .from('user_personalization_updates')
          .update(updateData)
          .eq('id', editingUpdate.id)
          .eq('user_id', userId);

        if (error) {
          console.error('[Settings] handleSaveUpdate: Error updating update:', error);
          if (__DEV__) {
            showErrorToast(`Failed to save update: ${error.message}`);
          } else {
            showErrorToast('Failed to save update');
          }
        } else {
          console.log('[Settings] handleSaveUpdate: Update saved successfully');
          showSuccessToast('Update saved');
          handleCloseAddUpdateModal();
          await fetchUpdates();
        }
      } else {
        // Insert new - optimistic update
        console.log('[Settings] handleSaveUpdate: Creating new update');
        const tempId = 'temp-' + Date.now();
        const newUpdate: PersonalizationUpdate = {
          id: tempId,
          ...updateData,
          created_at: new Date().toISOString(),
        };
        
        // Optimistically add to list
        console.log('[Settings] handleSaveUpdate: Adding optimistic update to list');
        setUpdates(prev => [newUpdate, ...prev]);
        
        const { data, error } = await supabase
          .from('user_personalization_updates')
          .insert([updateData])
          .select()
          .single();

        if (error) {
          console.error('[Settings] handleSaveUpdate: Error creating update:', error);
          if (__DEV__) {
            showErrorToast(`Failed to save update: ${error.message}`);
          } else {
            showErrorToast('Failed to save update');
          }
          // Revert optimistic update
          console.log('[Settings] handleSaveUpdate: Reverting optimistic update');
          await fetchUpdates();
        } else {
          console.log('[Settings] handleSaveUpdate: Update created successfully:', data);
          showSuccessToast('Update added');
          handleCloseAddUpdateModal();
          // Replace temp with real data
          await fetchUpdates();
        }
      }
    } catch (error) {
      console.error('[Settings] handleSaveUpdate: Exception saving update:', error);
      if (__DEV__) {
        showErrorToast(`Exception: ${error}`);
      } else {
        showErrorToast('Failed to save update');
      }
      await fetchUpdates();
    } finally {
      setIsSavingUpdate(false);
      console.log('[Settings] handleSaveUpdate: Save process complete');
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    console.log('[Settings] handleDeleteUpdate: Deleting update:', updateId);
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
                .eq('id', updateId)
                .eq('user_id', userId);

              if (error) {
                console.error('[Settings] handleDeleteUpdate: Error deleting update:', error);
                if (__DEV__) {
                  showErrorToast(`Failed to delete update: ${error.message}`);
                } else {
                  showErrorToast('Failed to delete update');
                }
              } else {
                console.log('[Settings] handleDeleteUpdate: Update deleted successfully');
                showSuccessToast('Update deleted');
                await fetchUpdates();
              }
            } catch (error) {
              console.error('[Settings] handleDeleteUpdate: Exception deleting update:', error);
              if (__DEV__) {
                showErrorToast(`Exception: ${error}`);
              } else {
                showErrorToast('Failed to delete update');
              }
            }
          },
        },
      ]
    );
  };

  const toggleUpdateExpanded = (updateId: string) => {
    setExpandedUpdateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderPersonaCard = (personaId: string) => {
    const persona = getPersonaById(personaId);
    if (!persona) return null;

    const isSelected = selectedPersonaId === persona.id;

    return (
      <View
        key={persona.id}
        style={[
          styles.personaCard,
          {
            backgroundColor: isSelected ? theme.primary + '15' : theme.background,
            borderColor: isSelected ? theme.primary : theme.textSecondary + '30',
          },
        ]}
        accessible={true}
        accessibilityLabel={`${persona.name}, ${persona.label}. ${persona.short_description}. ${isSelected ? 'Selected' : 'Not selected'}`}
        accessibilityRole="button"
      >
        <Pressable
          style={styles.personaCardTouchable}
          onPress={() => setSelectedPersonaId(persona.id)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessible={false}
        >
          <Image
            source={persona.image}
            style={styles.personaImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
            accessible={true}
            accessibilityLabel={`${persona.name} avatar`}
          />
          <View style={styles.personaCardContent}>
            <View style={styles.personaCardHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.personaName,
                    {
                      color: isSelected ? theme.primary : theme.textPrimary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {persona.name}
                </Text>
                <Text
                  style={[
                    styles.personaLabel,
                    {
                      color: isSelected ? theme.primary : theme.textSecondary,
                    },
                  ]}
                >
                  {persona.label}
                </Text>
              </View>
              {isSelected && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={24}
                  color={theme.primary}
                />
              )}
            </View>
            <Text style={[styles.personaDescription, { color: theme.textSecondary }]}>
              {persona.short_description}
            </Text>
          </View>
        </Pressable>
        
        {/* Preview Style Button */}
        <Pressable
          style={[styles.previewButton, { borderColor: theme.primary }]}
          onPress={() => handleOpenPreview(persona.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible={true}
          accessibilityLabel={`Preview ${persona.name}'s communication style`}
          accessibilityRole="button"
        >
          <IconSymbol
            ios_icon_name="eye.fill"
            android_material_icon_name="visibility"
            size={16}
            color={theme.primary}
          />
          <Text style={[styles.previewButtonText, { color: theme.primary }]}>
            Preview style
          </Text>
        </Pressable>
      </View>
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
          <Pressable
            key={index}
            style={[
              styles.optionCard,
              {
                backgroundColor: selectedValue === option ? theme.primary + '15' : theme.background,
                borderColor: selectedValue === option ? theme.primary : theme.textSecondary + '30',
              },
            ]}
            onPress={() => onSelect(option)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityLabel={`${option}. ${selectedValue === option ? 'Selected' : 'Not selected'}`}
            accessibilityRole="button"
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
          </Pressable>
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

  // Check if any modal is open
  const isAnyModalOpen = 
    showInfoModal ||
    showDeleteModal ||
    showChangePasswordModal ||
    showPersonaModal ||
    showPersonalizationInfoModal ||
    showClearPersonalizationModal ||
    showPersonalizationModal ||
    showUpdatesModal ||
    showAddUpdateModal;

  return (
    <>
      <LinearGradient
        colors={theme.primaryGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} pointerEvents="none">
          <View style={styles.container} pointerEvents="none">
            {/* Header with Back Button on LEFT and Info Icon on RIGHT */}
            <View style={styles.topHeader}>
              <Pressable 
                onPress={handleBack} 
                style={styles.backButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessible={true}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow_back"
                  size={24}
                  color={theme.buttonText}
                />
              </Pressable>
              
              <View style={styles.headerSpacer} />
              
              <Pressable 
                onPress={handleInfoPress} 
                style={styles.infoButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessible={true}
                accessibilityLabel="Settings information"
                accessibilityRole="button"
              >
                <IconSymbol
                  ios_icon_name="info.circle"
                  android_material_icon_name="info"
                  size={24}
                  color={theme.buttonText}
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 60 + insets.bottom + 16 }
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              pointerEvents="auto"
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

                <Pressable
                  style={[styles.row, { borderBottomWidth: 0 }]}
                  onPress={handleOpenChangePasswordModal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityLabel="Change password"
                  accessibilityRole="button"
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
                </Pressable>
              </View>

              {/* Card 2.5: Therapist Selection (Optional) */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Therapist Selection (Optional)
                </Text>

                <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                  Choose a communication style that feels comfortable. You can change or skip this anytime.
                </Text>

                {/* Therapist Persona Selection */}
                <Pressable
                  style={[styles.row, { borderBottomWidth: 0, marginTop: 8 }]}
                  onPress={handleOpenPersonaModal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityLabel={`Therapist selection. Currently ${selectedPersona ? `${selectedPersona.name}, ${selectedPersona.label}` : 'not selected'}`}
                  accessibilityRole="button"
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
                        Therapist
                      </Text>
                      <Text style={[styles.rowSubtext, { color: theme.textSecondary }]}>
                        {selectedPersona ? `${selectedPersona.name} — ${selectedPersona.label}` : 'Not selected'}
                      </Text>
                    </View>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>

              {/* Card 2.6: Personalization (Optional) */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Personalization (Optional)
                  </Text>
                  <Pressable
                    onPress={handleOpenPersonalizationInfoModal}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.whyWeAskButton}
                    accessible={true}
                    accessibilityLabel="Why we ask for personalization"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.whyWeAskText, { color: theme.primary }]}>
                      Why we ask
                    </Text>
                  </Pressable>
                </View>

                <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
                  Share what helps conversations feel natural for you. You can change or remove this anytime.
                </Text>

                <Pressable
                  style={[styles.row, { borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)', marginTop: 8 }]}
                  onPress={handleOpenPersonalizationModal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityLabel={`Personalization settings. ${hasPersonalizationData ? 'Configured' : 'Not set'}`}
                  accessibilityRole="button"
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
                </Pressable>

                {/* Updates Over Time Section */}
                <Pressable
                  style={[styles.row, { borderBottomWidth: 0, marginTop: 0 }]}
                  onPress={handleOpenUpdatesModal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityLabel={`Updates over time. ${updates.length > 0 ? `${updates.length} update${updates.length !== 1 ? 's' : ''}` : 'No updates yet'}`}
                  accessibilityRole="button"
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
                </Pressable>
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
                    <Pressable
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
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessible={true}
                      accessibilityLabel={`${themeOption.name} theme. ${selectedTheme === themeOption.key ? 'Selected' : 'Not selected'}`}
                      accessibilityRole="button"
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
                    </Pressable>
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

                <Pressable
                  style={[styles.row, { borderBottomWidth: 0 }]}
                  onPress={handleSupportPress}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityLabel="Contact support"
                  accessibilityRole="button"
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
                </Pressable>
              </View>

              {/* Card 5: Legal */}
              <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                  Legal
                </Text>

                <Pressable
                  style={styles.row}
                  onPress={handlePrivacyPress}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityLabel="Privacy policy"
                  accessibilityRole="button"
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
                </Pressable>

                <Pressable
                  style={[styles.row, { borderBottomWidth: 0 }]}
                  onPress={handleTermsPress}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityLabel="Terms and conditions"
                  accessibilityRole="button"
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
                </Pressable>
              </View>

              {/* Log Out Button */}
              <Pressable
                style={[styles.logoutButton, { backgroundColor: '#FF6B6B' }]}
                onPress={handleSignOut}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessible={true}
                accessibilityLabel="Log out"
                accessibilityRole="button"
              >
                <IconSymbol
                  ios_icon_name="arrow.right.square.fill"
                  android_material_icon_name="logout"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>

              {/* Account Deletion Section */}
              <View style={styles.accountSection}>
                <Text style={[styles.sectionTitle, { color: theme.buttonText }]}>
                  Account
                </Text>
                <View style={[styles.dangerCard, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={handleDeleteAccount}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessible={true}
                    accessibilityLabel="Delete my account"
                    accessibilityRole="button"
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.deleteButtonText}>Delete My Account</Text>
                  </Pressable>
                  <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                    This will permanently remove your profile and conversations.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Info Modal - ONLY render when visible */}
      {showInfoModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseInfoModal}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={handleCloseInfoModal}
            pointerEvents="auto"
          >
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
                onPress={handleCloseInfoModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {/* Delete Confirmation Modal - ONLY render when visible */}
      {showDeleteModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelDelete}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={handleCancelDelete}
            pointerEvents="auto"
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}
              onPress={(e) => e.stopPropagation()}
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
                  onPress={handleCancelDelete}
                  disabled={isDeleting}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButtonHalf, styles.confirmDeleteButton]}
                  onPress={handleConfirmDelete}
                  disabled={isDeleting}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
      ) : null}

      {/* Change Password Modal - ONLY render when visible */}
      {showChangePasswordModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseChangePasswordModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
            pointerEvents="box-none"
          >
            <Pressable 
              style={{ flex: 1 }}
              onPress={handleCloseChangePasswordModal}
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
                    <Pressable
                      style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                      onPress={handleCloseChangePasswordModal}
                      disabled={isUpdatingPassword}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.modalButtonHalf, { backgroundColor: theme.primary }]}
                      onPress={handleSavePassword}
                      disabled={isUpdatingPassword}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isUpdatingPassword ? (
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
      ) : null}

      {/* Therapist Persona Modal - ONLY render when visible */}
      {showPersonaModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={handleClosePersonaModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
            pointerEvents="box-none"
          >
            <Pressable 
              style={{ flex: 1 }}
              onPress={handleClosePersonaModal}
              pointerEvents="auto"
            >
              <Pressable 
                style={[styles.modalContent, { backgroundColor: '#FFFFFF', maxHeight: SCREEN_HEIGHT * 0.85 }]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalIconContainer}>
                  <IconSymbol
                    ios_icon_name="person.circle.fill"
                    android_material_icon_name="account_circle"
                    size={48}
                    color={theme.primary}
                  />
                </View>

                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Choose a Communication Style
                </Text>

                <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                  Pick a style that feels comfortable. This is optional and you can change it anytime.
                </Text>

                <ScrollView 
                  style={styles.personaScrollView}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  {THERAPIST_PERSONAS.map((persona) => renderPersonaCard(persona.id))}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                    onPress={handleClosePersonaModal}
                    disabled={isUpdatingPersona}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalButtonHalf, { backgroundColor: theme.primary }]}
                    onPress={handleSavePersona}
                    disabled={isUpdatingPersona}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isUpdatingPersona ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalButtonText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}



      {/* Personalization Info Modal - ONLY render when visible */}
      {showPersonalizationInfoModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={handleClosePersonalizationInfoModal}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={handleClosePersonalizationInfoModal}
            pointerEvents="auto"
          >
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
                Why Personalization?
              </Text>

              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                This helps the AI match your preferred tone, pacing, and examples. It does not diagnose or label you. You&apos;re always in control, and you can clear this anytime.
              </Text>

              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleClosePersonalizationInfoModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {/* Clear Personalization Confirmation Modal - ONLY render when visible */}
      {showClearPersonalizationModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseClearPersonalizationModal}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={handleCloseClearPersonalizationModal}
            pointerEvents="auto"
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}
              onPress={(e) => e.stopPropagation()}
            >
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
                <Pressable
                  style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                  onPress={handleCloseClearPersonalizationModal}
                  disabled={isClearingPersonalization}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButtonHalf, { backgroundColor: '#FF9500' }]}
                  onPress={handleConfirmClearPersonalization}
                  disabled={isClearingPersonalization}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isClearingPersonalization ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Clear</Text>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {/* Personalization Modal - ONLY render when visible */}
      {showPersonalizationModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={handleClosePersonalizationModal}
        >
          <SafeAreaView style={styles.personalizationModalSafeArea} edges={['top', 'bottom']} pointerEvents="box-none">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.personalizationModalContainer}
              pointerEvents="box-none"
            >
              <Pressable 
                style={{ flex: 1 }}
                onPress={handleClosePersonalizationModal}
                pointerEvents="auto"
              >
                <Pressable 
                  style={[
                    styles.personalizationModalContent, 
                    { 
                      backgroundColor: '#FFFFFF',
                      width: modalMaxWidth,
                      maxWidth: '100%',
                      alignSelf: 'center',
                    }
                  ]}
                  onPress={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <View style={[styles.personalizationModalHeader, { paddingTop: isCompactScreen ? 12 : 16 }]}>
                    <View style={styles.modalIconContainer}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={isCompactScreen ? 40 : 48}
                        color={theme.primary}
                      />
                    </View>

                    <Text style={[styles.modalTitle, { color: theme.textPrimary, fontSize: isCompactScreen ? 20 : 24 }]}>
                      Personalization (Optional)
                    </Text>

                    <Text style={[styles.modalText, { color: theme.textSecondary, marginBottom: isCompactScreen ? 12 : 16 }]}>
                      Share what helps conversations feel natural for you. You can change or remove this anytime.
                    </Text>
                  </View>

                  {/* Scrollable Content */}
                  <ScrollView 
                    style={styles.personalizationScrollView}
                    contentContainerStyle={[
                      styles.personalizationScrollContent,
                      { 
                        paddingBottom: actionBarHeight + insets.bottom + 20,
                      }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                  >
                    {/* Preferred conversation style */}
                    <View style={[styles.personalizationSection, { marginBottom: isCompactScreen ? 16 : 20 }]}>
                      <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                        Preferred conversation style
                      </Text>
                      <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                        Choose the tone that feels best to you.
                      </Text>
                      {renderOptionCard(CONVERSATION_STYLES, conversationStyle, setConversationStyle)}
                    </View>

                    {/* When you're stressed, what helps most? */}
                    <View style={[styles.personalizationSection, { marginBottom: isCompactScreen ? 16 : 20 }]}>
                      <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                        When you&apos;re stressed, what helps most?
                      </Text>
                      <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                        This helps the AI respond in a way that feels more useful.
                      </Text>
                      {renderOptionCard(STRESS_RESPONSES, stressResponse, setStressResponse)}
                    </View>

                    {/* How do you prefer to process feelings? */}
                    <View style={[styles.personalizationSection, { marginBottom: isCompactScreen ? 16 : 20 }]}>
                      <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                        How do you prefer to process feelings?
                      </Text>
                      <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                        Everyone processes differently — pick what fits you best.
                      </Text>
                      {renderOptionCard(PROCESSING_STYLES, processingStyle, setProcessingStyle)}
                    </View>

                    {/* Decision-making style */}
                    <View style={[styles.personalizationSection, { marginBottom: isCompactScreen ? 16 : 20 }]}>
                      <Text style={[styles.personalizationFieldLabel, { color: theme.textPrimary }]}>
                        Decision-making style
                      </Text>
                      <Text style={[styles.personalizationFieldHelper, { color: theme.textSecondary }]}>
                        How do you usually prefer to decide?
                      </Text>
                      {renderOptionCard(DECISION_STYLES, decisionStyle, setDecisionStyle)}
                    </View>

                    {/* Cultural context (optional) */}
                    <View style={[styles.personalizationSection, { marginBottom: isCompactScreen ? 16 : 20 }]}>
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
                    <View style={[styles.personalizationSection, { marginBottom: isCompactScreen ? 16 : 20 }]}>
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
                    <View style={[styles.personalizationSection, { marginBottom: isCompactScreen ? 16 : 20 }]}>
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

                  {/* Sticky Action Bar */}
                  <View 
                    style={[
                      styles.personalizationActionBar,
                      { 
                        paddingBottom: insets.bottom + 12,
                        backgroundColor: '#FFFFFF',
                      }
                    ]}
                  >
                    <Pressable
                      style={[styles.modalButton, { backgroundColor: theme.primary, marginBottom: 10 }]}
                      onPress={handleSavePersonalization}
                      disabled={isUpdatingPersonalization}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isUpdatingPersonalization ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.modalButtonText}>Save changes</Text>
                      )}
                    </Pressable>

                    <View style={styles.modalButtons}>
                      <Pressable
                        style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                        onPress={handleClosePersonalizationModal}
                        disabled={isUpdatingPersonalization}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                          Cancel
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[styles.modalButtonHalf, { backgroundColor: '#FF9500' }]}
                        onPress={handleOpenClearPersonalizationModal}
                        disabled={isUpdatingPersonalization}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.modalButtonText}>Clear data</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              </Pressable>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      ) : null}

      {/* Updates Over Time Modal - ONLY render when visible */}
      {showUpdatesModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseUpdatesModal}
        >
          <SafeAreaView style={styles.updatesModalSafeArea} edges={['top', 'bottom']} pointerEvents="box-none">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.updatesModalContainer}
              pointerEvents="box-none"
            >
              <Pressable 
                style={{ flex: 1 }}
                onPress={handleCloseUpdatesModal}
                pointerEvents="auto"
              >
                <Pressable 
                  style={[
                    styles.updatesModalContent, 
                    { 
                      backgroundColor: '#FFFFFF',
                      paddingTop: insets.top,
                    }
                  ]}
                  onPress={(e) => e.stopPropagation()}
                >
                  {/* Sticky Header */}
                  <View style={styles.updatesModalHeader}>
                    <Pressable
                      onPress={handleCloseUpdatesModal}
                      style={styles.updatesModalCloseButton}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <IconSymbol
                        ios_icon_name="xmark"
                        android_material_icon_name="close"
                        size={24}
                        color={theme.textSecondary}
                      />
                    </Pressable>
                    <Text style={[styles.updatesModalTitle, { color: theme.textPrimary }]}>
                      Updates Over Time
                    </Text>
                    <View style={{ width: 40 }} />
                  </View>

                  {/* Description + Add Button */}
                  <View style={styles.updatesModalTopSection}>
                    <Text style={[styles.updatesModalDescription, { color: theme.textSecondary }]}>
                      Add short updates so responses stay relevant to what you&apos;re experiencing.
                    </Text>

                    <Pressable
                      style={[styles.addUpdateButton, { backgroundColor: theme.primary }]}
                      onPress={handleOpenAddUpdateModal}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <IconSymbol
                        ios_icon_name="plus"
                        android_material_icon_name="add"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.addUpdateButtonText}>Add update</Text>
                    </Pressable>
                  </View>

                  {/* Scrollable List */}
                  <ScrollView
                    style={styles.updatesListScrollView}
                    contentContainerStyle={[
                      styles.updatesListContent,
                      { 
                        flexGrow: 1,
                        paddingBottom: insets.bottom + 20,
                      }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
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
                          size={isCompactScreen ? 40 : 48}
                          color={theme.textSecondary}
                        />
                        <Text style={[styles.updatesEmptyText, { color: theme.textSecondary, fontSize: isCompactScreen ? 16 : 18 }]}>
                          No updates yet
                        </Text>
                        <Text style={[styles.updatesEmptySubtext, { color: theme.textSecondary, fontSize: isCompactScreen ? 13 : 14 }]}>
                          Add your first update to help personalize your experience
                        </Text>
                      </View>
                    ) : (
                      updates.map((update, index) => {
                        const isExpanded = expandedUpdateIds.has(update.id);
                        const hasLongContent = update.title.length > 100;
                        
                        return (
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
                            <Pressable
                              onPress={() => hasLongContent && toggleUpdateExpanded(update.id)}
                              disabled={!hasLongContent}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <View style={styles.updateCardHeader}>
                                <Text 
                                  style={[styles.updateCardTitle, { color: theme.textPrimary }]}
                                  numberOfLines={isExpanded ? undefined : 3}
                                >
                                  {update.title}
                                </Text>
                                <Text style={[styles.updateCardDate, { color: theme.textSecondary }]}>
                                  {formatRelativeDate(update.created_at)}
                                </Text>
                              </View>

                              {hasLongContent && (
                                <Text style={[styles.expandText, { color: theme.primary }]}>
                                  {isExpanded ? 'Show less' : 'Show more'}
                                </Text>
                              )}
                            </Pressable>

                            {update.details && (
                              <Text
                                style={[styles.updateCardDetails, { color: theme.textSecondary }]}
                                numberOfLines={isExpanded ? undefined : 2}
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
                              <Pressable
                                style={styles.updateCardActionButton}
                                onPress={() => handleOpenEditUpdateModal(update)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                              </Pressable>

                              <Pressable
                                style={styles.updateCardActionButton}
                                onPress={() => handleDeleteUpdate(update.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                              </Pressable>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      ) : null}

      {/* Add/Edit Update Modal - ONLY render when visible */}
      {showAddUpdateModal ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseAddUpdateModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
            pointerEvents="box-none"
          >
            <Pressable 
              style={{ flex: 1 }}
              onPress={handleCloseAddUpdateModal}
              pointerEvents="auto"
            >
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                bounces={false}
              >
                <Pressable 
                  style={[styles.addUpdateModalContent, { backgroundColor: '#FFFFFF' }]}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalIconContainer}>
                    <IconSymbol
                      ios_icon_name="plus.circle.fill"
                      android_material_icon_name="add_circle"
                      size={48}
                      color={theme.primary}
                    />
                  </View>

                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    {editingUpdate ? 'Edit Update' : 'Add an update'}
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                      What&apos;s changed recently? *
                    </Text>
                    <TextInput
                      style={[
                        styles.multilineTextInput,
                        {
                          backgroundColor: theme.background,
                          color: theme.textPrimary,
                          borderColor: validationError ? '#FF3B30' : theme.primary,
                        },
                      ]}
                      placeholder="What's changed recently?"
                      placeholderTextColor={theme.textSecondary}
                      value={updateTitle}
                      onChangeText={(text) => {
                        setUpdateTitle(text);
                        if (validationError) setValidationError('');
                      }}
                      multiline
                      numberOfLines={3}
                      maxLength={500}
                      editable={!isSavingUpdate}
                    />
                    <View style={styles.inputFooter}>
                      {validationError ? (
                        <Text style={styles.errorText}>{validationError}</Text>
                      ) : null}
                      <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                        {updateTitle.trim().length}/500
                      </Text>
                    </View>
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
                    <Pressable
                      style={[styles.modalButtonHalf, styles.cancelButton, { borderColor: theme.textSecondary }]}
                      onPress={handleCloseAddUpdateModal}
                      disabled={isSavingUpdate}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.modalButtonHalf, 
                        { 
                          backgroundColor: theme.primary,
                          opacity: (!updateTitle.trim() || isSavingUpdate) ? 0.5 : 1,
                        }
                      ]}
                      onPress={handleSaveUpdate}
                      disabled={!updateTitle.trim() || isSavingUpdate}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isSavingUpdate ? (
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
      ) : null}
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
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    marginLeft: 8,
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
  },
  personaCardTouchable: {
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
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    marginTop: 12,
    gap: 6,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // RESPONSIVE PERSONALIZATION MODAL STYLES
  personalizationModalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  personalizationModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  personalizationModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    flex: 1,
  },
  personalizationModalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  personalizationScrollView: {
    flex: 1,
  },
  personalizationScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  personalizationSection: {
    marginBottom: 20,
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
  personalizationActionBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.05)',
    elevation: 4,
  },

  // RESPONSIVE UPDATES OVER TIME MODAL STYLES
  updatesModalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  updatesModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  updatesModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    flex: 1,
  },
  updatesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  updatesModalTopSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  updatesModalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  addUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
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
    paddingTop: 12,
  },
  updatesLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  updatesEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  updatesEmptyText: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  updatesEmptySubtext: {
    textAlign: 'center',
    lineHeight: 20,
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
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
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
