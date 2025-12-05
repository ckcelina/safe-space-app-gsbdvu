
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';

export default function SettingsScreen() {
  const { currentUser, email, role, signOut } = useAuth();
  const { themeKey, theme, setTheme } = useThemeContext();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(themeKey);

  useEffect(() => {
    setSelectedTheme(themeKey);
  }, [themeKey]);

  const themes: Array<{ key: ThemeKey; name: string; description: string }> = [
    { key: 'OceanBlue', name: 'Ocean Blue', description: 'Calm and serene' },
    { key: 'SoftRose', name: 'Soft Rose', description: 'Gentle and nurturing' },
    { key: 'ForestGreen', name: 'Forest Green', description: 'Grounded and peaceful' },
  ];

  const handleThemeSelect = async (themeKey: ThemeKey) => {
    setSelectedTheme(themeKey);
    await setTheme(themeKey);
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleTermsPress = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://safespace.app/terms');
    } catch (error) {
      console.error('Error opening terms:', error);
      Alert.alert('Error', 'Could not open Terms & Conditions');
    }
  };

  const handlePrivacyPress = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://safespace.app/privacy');
    } catch (error) {
      console.error('Error opening privacy:', error);
      Alert.alert('Error', 'Could not open Privacy Policy');
    }
  };

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

  const getPlanBadge = () => {
    if (role === 'premium' || role === 'admin') {
      return 'Plan: Premium';
    }
    return 'Plan: Free';
  };

  const getPlanBadgeColor = () => {
    if (role === 'premium' || role === 'admin') {
      return '#FFD700';
    }
    return theme.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBarGradient />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with App Icon, Email, and Plan */}
        <View style={[styles.headerCard, { backgroundColor: theme.card }]}>
          <View style={[styles.iconBackground, { backgroundColor: theme.background, borderColor: theme.primary }]}>
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="shield"
              size={48}
              color={theme.primary}
            />
          </View>
          
          <Text style={[styles.emailText, { color: theme.textPrimary }]}>
            {email || 'Not available'}
          </Text>
          
          <View style={[styles.planBadge, { backgroundColor: theme.background }]}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={16}
              color={getPlanBadgeColor()}
            />
            <Text style={[styles.planText, { color: getPlanBadgeColor() }]}>
              {getPlanBadge()}
            </Text>
          </View>
        </View>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Theme
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Choose your preferred theme. Changes apply immediately.
          </Text>

          {themes.map((themeOption) => (
            <TouchableOpacity
              key={themeOption.key}
              style={[
                styles.themeCard,
                {
                  backgroundColor: theme.card,
                  borderColor: selectedTheme === themeOption.key ? theme.primary : 'transparent',
                  borderWidth: selectedTheme === themeOption.key ? 3 : 1,
                },
              ]}
              onPress={() => handleThemeSelect(themeOption.key)}
              activeOpacity={0.7}
            >
              <View style={styles.themeCardContent}>
                <View style={styles.themeInfo}>
                  <Text style={[styles.themeName, { color: theme.textPrimary }]}>
                    {themeOption.name}
                  </Text>
                  <Text style={[styles.themeDescription, { color: theme.textSecondary }]}>
                    {themeOption.description}
                  </Text>
                </View>
                {selectedTheme === themeOption.key && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={28}
                    color={theme.primary}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Items Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Account
          </Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="person.circle.fill"
              android_material_icon_name="account_circle"
              size={24}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>
              Edit Profile
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={handleTermsPress}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={24}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>
              Terms & Conditions
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={handlePrivacyPress}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="lock.shield.fill"
              android_material_icon_name="privacy_tip"
              size={24}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>
              Privacy Policy
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
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
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 120,
  },
  headerCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  planText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  themeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  themeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
