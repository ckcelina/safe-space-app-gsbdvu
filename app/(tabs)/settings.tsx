
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Pressable,
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
import { getPersonaById } from '@/constants/TherapistPersonas';
import { Linking } from 'react-native';

// Import modals
import { InfoModal } from '@/components/settings/InfoModal';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { TherapistPersonaModal } from '@/components/settings/TherapistPersonaModal';
import { PersonalizationModal } from '@/components/settings/PersonalizationModal';
import { PersonalizationInfoModal } from '@/components/settings/PersonalizationInfoModal';
import { ClearPersonalizationModal } from '@/components/settings/ClearPersonalizationModal';
import { UpdatesOverTimeModal } from '@/components/settings/UpdatesOverTimeModal';

export default function SettingsScreen() {
  const { email, role, userId, signOut } = useAuth();
  const { themeKey, theme, setTheme } = useThemeContext();
  const { preferences, updatePreferences } = useUserPreferences();
  const insets = useSafeAreaInsets();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(themeKey);
  
  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [showPersonalizationInfoModal, setShowPersonalizationInfoModal] = useState(false);
  const [showClearPersonalizationModal, setShowClearPersonalizationModal] = useState(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);

  useEffect(() => {
    console.log('[Settings] Screen mounted');
    return () => {
      console.log('[Settings] Screen unmounted');
    };
  }, []);

  useEffect(() => {
    setSelectedTheme(themeKey);
  }, [themeKey]);

  const themes: { key: ThemeKey; name: string }[] = [
    { key: 'OceanBlue', name: 'Ocean Blue' },
    { key: 'SoftRose', name: 'Soft Rose' },
    { key: 'ForestGreen', name: 'Forest Green' },
    { key: 'SunnyYellow', name: 'Sunny Yellow' },
  ];

  const handleThemeSelect = async (themeKey: ThemeKey) => {
    console.log('[Settings] Theme selected:', themeKey);
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
    console.log('[Settings] Back button pressed');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/(home)');
    }
  };

  const handleSupportPress = async () => {
    console.log('[Settings] Support button pressed');
    try {
      await openSupportEmail();
    } catch (error) {
      console.error('[Settings] Error opening support email:', error);
      showErrorToast('Could not open email app');
    }
  };

  const handlePrivacyPress = async () => {
    console.log('[Settings] Privacy policy button pressed');
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
    console.log('[Settings] Terms button pressed');
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
    <View style={styles.rootContainer}>
      {/* Background gradient - positioned absolutely, doesn't block touches */}
      <LinearGradient
        colors={theme.primaryGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      
      {/* Interactive content */}
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
        pointerEvents="box-none"
      >
        <View style={styles.container} pointerEvents="box-none">
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
              onPress={() => {
                console.log('[Settings] Info button pressed');
                setShowInfoModal(true);
              }} 
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
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled={true}
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
                onPress={() => {
                  console.log('[Settings] Change password button pressed');
                  setShowChangePasswordModal(true);
                }}
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
                onPress={() => {
                  console.log('[Settings] Therapist selection button pressed');
                  setShowPersonaModal(true);
                }}
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
                  onPress={() => {
                    console.log('[Settings] Why we ask button pressed');
                    setShowPersonalizationInfoModal(true);
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
                onPress={() => {
                  console.log('[Settings] Personalization settings button pressed');
                  setShowPersonalizationModal(true);
                }}
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
                onPress={() => {
                  console.log('[Settings] Updates over time button pressed');
                  setShowUpdatesModal(true);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessible={true}
                accessibilityLabel="Updates over time"
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
                      Track changes over time
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
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
                style={styles.row}
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

              {__DEV__ && (
                <Pressable
                  style={[styles.row, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    console.log('[Settings] Test AI Response button pressed');
                    router.push('/test-ai-response');
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityLabel="Test AI Response (Dev Only)"
                  accessibilityRole="button"
                >
                  <View style={styles.rowLeft}>
                    <IconSymbol
                      ios_icon_name="wrench.and.screwdriver.fill"
                      android_material_icon_name="build"
                      size={20}
                      color="#FF9500"
                    />
                    <Text style={[styles.rowLabel, { color: theme.textPrimary, marginLeft: 12 }]}>
                      Test AI Response (Dev)
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow_forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              )}
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
                  onPress={() => {
                    console.log('[Settings] Delete account button pressed');
                    setShowDeleteModal(true);
                  }}
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

      {/* Modals - Only render when visible */}
      {showInfoModal && (
        <InfoModal 
          visible={showInfoModal}
          onClose={() => {
            console.log('[Settings] Closing info modal');
            setShowInfoModal(false);
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          visible={showDeleteModal}
          onClose={() => {
            console.log('[Settings] Closing delete modal');
            setShowDeleteModal(false);
          }}
          userId={userId}
          onSuccess={handleLogout}
        />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          visible={showChangePasswordModal}
          onClose={() => {
            console.log('[Settings] Closing change password modal');
            setShowChangePasswordModal(false);
          }}
        />
      )}

      {showPersonaModal && (
        <TherapistPersonaModal
          visible={showPersonaModal}
          onClose={() => {
            console.log('[Settings] Closing persona modal');
            setShowPersonaModal(false);
          }}
        />
      )}

      {showPersonalizationInfoModal && (
        <PersonalizationInfoModal
          visible={showPersonalizationInfoModal}
          onClose={() => {
            console.log('[Settings] Closing personalization info modal');
            setShowPersonalizationInfoModal(false);
          }}
        />
      )}

      {showPersonalizationModal && (
        <PersonalizationModal
          visible={showPersonalizationModal}
          onClose={() => {
            console.log('[Settings] Closing personalization modal');
            setShowPersonalizationModal(false);
          }}
          onOpenClearModal={() => {
            console.log('[Settings] Opening clear personalization modal');
            setShowPersonalizationModal(false);
            setTimeout(() => setShowClearPersonalizationModal(true), 300);
          }}
        />
      )}

      {showClearPersonalizationModal && (
        <ClearPersonalizationModal
          visible={showClearPersonalizationModal}
          onClose={() => {
            console.log('[Settings] Closing clear personalization modal');
            setShowClearPersonalizationModal(false);
          }}
        />
      )}

      {showUpdatesModal && (
        <UpdatesOverTimeModal
          visible={showUpdatesModal}
          onClose={() => {
            console.log('[Settings] Closing updates modal');
            setShowUpdatesModal(false);
          }}
          userId={userId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
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
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
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
    fontSize: 20,
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
    fontSize: 16,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
