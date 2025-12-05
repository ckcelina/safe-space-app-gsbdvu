
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
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';

export default function SettingsScreen() {
  const { email, role, signOut } = useAuth();
  const { themeKey, theme, setTheme } = useThemeContext();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(themeKey);

  useEffect(() => {
    setSelectedTheme(themeKey);
  }, [themeKey]);

  const themes: Array<{ key: ThemeKey; name: string }> = [
    { key: 'OceanBlue', name: 'Ocean Blue' },
    { key: 'SoftRose', name: 'Soft Rose' },
    { key: 'ForestGreen', name: 'Forest Green' },
  ];

  const handleThemeSelect = async (themeKey: ThemeKey) => {
    setSelectedTheme(themeKey);
    await setTheme(themeKey);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getPlanDisplay = () => {
    if (role === 'admin') {
      return { text: 'Admin', icon: 'shield.fill', androidIcon: 'shield' };
    } else if (role === 'premium') {
      return { text: 'Premium', icon: 'crown.fill', androidIcon: 'workspace_premium' };
    }
    return { text: 'Free', icon: null, androidIcon: null };
  };

  const planInfo = getPlanDisplay();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBarGradient />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Settings
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your account & preferences
          </Text>
        </View>

        {/* Card 1: Account */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Account
          </Text>

          {/* Email Row */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
              Email
            </Text>
            <Text style={[styles.rowValue, { color: theme.textPrimary }]}>
              {email || 'Not available'}
            </Text>
          </View>

          {/* Plan Row */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
              Plan
            </Text>
            <View style={styles.planContainer}>
              {planInfo.icon && (
                <IconSymbol
                  ios_icon_name={planInfo.icon}
                  android_material_icon_name={planInfo.androidIcon || 'star'}
                  size={18}
                  color={role === 'premium' || role === 'admin' ? '#FFD700' : theme.textPrimary}
                />
              )}
              <Text
                style={[
                  styles.rowValue,
                  {
                    color: role === 'premium' || role === 'admin' ? '#FFD700' : theme.textPrimary,
                    marginLeft: planInfo.icon ? 6 : 0,
                  },
                ]}
              >
                {planInfo.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Card 2: Appearance */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Appearance
          </Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Theme
          </Text>

          <View style={styles.pillContainer}>
            {themes.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.key}
                style={[
                  styles.pill,
                  {
                    backgroundColor:
                      selectedTheme === themeOption.key
                        ? theme.primary
                        : theme.background,
                    borderColor: theme.primary,
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

        {/* Log Out Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#FF6B6B' }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log out</Text>
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
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 20,
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
    marginTop: 32,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
