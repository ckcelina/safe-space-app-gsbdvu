
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors as oceanBlueColors, softRoseColors, forestGreenColors, sunnyYellowColors } from '@/styles/commonStyles';

export default function ProfileScreen() {
  const { currentUser, email, role, signOut } = useAuth();
  const { theme, themeKey, setTheme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [previewThemeKey, setPreviewThemeKeyKey] = useState<ThemeKey>(themeKey);
  const [previewColors, setPreviewColors] = useState(oceanBlueColors);

  const themes = [
    { 
      id: 'ocean-blue' as ThemeKey, 
      name: 'Ocean Blue', 
      color: '#1890FF',
      colors: oceanBlueColors,
      description: 'Calm and professional'
    },
    { 
      id: 'soft-rose' as ThemeKey, 
      name: 'Soft Rose', 
      color: '#FF69B4',
      colors: softRoseColors,
      description: 'Warm and gentle'
    },
    { 
      id: 'forest-green' as ThemeKey, 
      name: 'Forest Green', 
      color: '#228B22',
      colors: forestGreenColors,
      description: 'Natural and refreshing'
    },
    { 
      id: 'sunny-yellow' as ThemeKey, 
      name: 'Sunny Yellow', 
      color: '#F59E0B',
      colors: sunnyYellowColors,
      description: 'Bright and energetic'
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleOpenThemeModal = () => {
    setPreviewThemeKey(themeKey);
    const selectedTheme = themes.find(t => t.id === themeKey);
    if (selectedTheme) {
      setPreviewColors(selectedTheme.colors);
    }
    setShowThemeModal(true);
  };

  const handleThemePreview = (themeId: ThemeKey) => {
    console.log('Previewing theme:', themeId);
    setPreviewThemeKey(themeId);
    const selectedTheme = themes.find(t => t.id === themeId);
    if (selectedTheme) {
      setPreviewColors(selectedTheme.colors);
    }
  };

  const handleSaveTheme = async () => {
    console.log('Saving theme:', previewThemeKey);
    await setTheme(previewThemeKey);
    setShowThemeModal(false);
    Alert.alert('Theme Saved', 'Your theme has been updated successfully!');
  };

  const handleCancelTheme = () => {
    console.log('Canceling theme change');
    setPreviewThemeKey(themeKey);
    const selectedTheme = themes.find(t => t.id === themeKey);
    if (selectedTheme) {
      setPreviewColors(selectedTheme.colors);
    }
    setShowThemeModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 60 + insets.bottom + 16 } // TAB_BAR_HEIGHT = 60
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Profile</Text>
        </View>

        {/* Plan Card - HIDDEN */}

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="envelope.fill"
              android_material_icon_name="email"
              size={24}
              color={theme.primary}
            />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Email
              </Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {email || 'Not available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade Card - HIDDEN */}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Settings
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.card }]}
            onPress={handleOpenThemeModal}
          >
            <IconSymbol
              ios_icon_name="paintbrush.fill"
              android_material_icon_name="palette"
              size={24}
              color={theme.primary}
            />
            <View style={styles.settingContent}>
              <Text style={[styles.settingText, { color: theme.textPrimary }]}>
                Theme
              </Text>
              <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
                {themes.find(t => t.id === theme)?.name}
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: '#FF6B6B' }]}
          onPress={handleSignOut}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square.fill"
            android_material_icon_name="logout"
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Theme Selection Modal with Live Preview */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelTheme}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card }]}>
            <TouchableOpacity onPress={handleCancelTheme} style={styles.modalButton}>
              <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Choose Theme
            </Text>
            <TouchableOpacity onPress={handleSaveTheme} style={styles.modalButton}>
              <Text style={[styles.modalButtonText, { color: theme.primary, fontWeight: '600' }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>
              Tap a theme to preview it
            </Text>

            {themes.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.id}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: previewThemeKey === themeOption.id ? theme.primary : theme.accent,
                    borderWidth: previewThemeKey === themeOption.id ? 3 : 1,
                  },
                ]}
                onPress={() => handleThemePreview(themeOption.id)}
              >
                <View style={styles.themeCardContent}>
                  <View
                    style={[styles.themeColorCircle, { backgroundColor: themeOption.color }]}
                  />
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeCardName, { color: theme.textPrimary }]}>
                      {themeOption.name}
                    </Text>
                    <Text style={[styles.themeDescription, { color: theme.textSecondary }]}>
                      {themeOption.description}
                    </Text>
                  </View>
                  {previewThemeKey === themeOption.id && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={28}
                      color={theme.primary}
                    />
                  )}
                </View>

                {/* Color Palette Preview */}
                <View style={styles.colorPalette}>
                  <View style={[styles.colorSwatch, { backgroundColor: themeOption.theme.primary }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: themeOption.theme.secondary }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: themeOption.theme.accent }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: themeOption.theme.highlight }]} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Preview Section */}
            <View style={styles.previewSection}>
              <Text style={[styles.previewSectionTitle, { color: theme.textPrimary }]}>
                Preview
              </Text>
              
              <View style={[styles.previewCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.previewCardTitle, { color: theme.textPrimary }]}>
                  Sample Card
                </Text>
                <Text style={[styles.previewCardText, { color: theme.textSecondary }]}>
                  This is how your content will look with this theme.
                </Text>
                <TouchableOpacity 
                  style={[styles.previewButton, { backgroundColor: theme.primary }]}
                  disabled
                >
                  <Text style={styles.previewButtonText}>Sample Button</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.previewCard, { backgroundColor: theme.highlight }]}>
                <Text style={[styles.previewCardTitle, { color: theme.textPrimary }]}>
                  Highlighted Content
                </Text>
                <Text style={[styles.previewCardText, { color: theme.textSecondary }]}>
                  Important information will be displayed like this.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  settingContent: {
    marginLeft: 16,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  modalButton: {
    padding: 8,
    minWidth: 70,
  },
  modalButtonText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  previewLabel: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  themeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  themeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  themeColorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  themeInfo: {
    flex: 1,
  },
  themeCardName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    width: 40,
    height: 24,
    borderRadius: 6,
  },
  previewSection: {
    marginTop: 24,
  },
  previewSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  previewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewCardText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  previewButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
