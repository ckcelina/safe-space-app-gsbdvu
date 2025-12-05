
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext, ThemeKey } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { StatusBarGradient } from '@/components/ui/StatusBarGradient';
import { WidgetPreviewCard } from '@/components/ui/WidgetPreviewCard';

export default function SettingsScreen() {
  const { email, role, signOut } = useAuth();
  const { themeKey, theme, setTheme } = useThemeContext();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(themeKey);

  useEffect(() => {
    setSelectedTheme(themeKey);
  }, [themeKey]);

  const themes: { key: ThemeKey; name: string }[] = [
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

  const handleBack = () => {
    router.back();
  };

  const getPlanDisplay = () => {
    if (role === 'admin') {
      return { 
        text: 'Plan: Admin – full access + management', 
        icon: 'shield.fill', 
        androidIcon: 'shield' 
      };
    } else if (role === 'premium') {
      return { 
        text: 'Plan: Premium – full access', 
        icon: 'crown.fill', 
        androidIcon: 'workspace_premium' 
      };
    }
    return { 
      text: 'Plan: Free', 
      icon: null, 
      androidIcon: null 
    };
  };

  const planInfo = getPlanDisplay();

  return (
    <LinearGradient
      colors={theme.primaryGradient}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBarGradient />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* Back Button */}
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
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
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
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  Email
                </Text>
                <Text style={[styles.rowValue, { color: theme.textPrimary }]}>
                  {email || 'Not available'}
                </Text>
              </View>

              {/* Plan Row */}
              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <View style={styles.planContainer}>
                  {planInfo.icon && (
                    <IconSymbol
                      ios_icon_name={planInfo.icon}
                      android_material_icon_name={planInfo.androidIcon || 'star'}
                      size={18}
                      color={role === 'premium' || role === 'admin' ? '#FFD700' : theme.textPrimary}
                      style={styles.planIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.planText,
                      {
                        color: role === 'premium' || role === 'admin' ? '#FFD700' : theme.textPrimary,
                      },
                    ]}
                  >
                    {planInfo.text}
                  </Text>
                </View>
              </View>
            </View>

            {/* Card 2: Appearance */}
            <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
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

            {/* Widget Preview Card */}
            <WidgetPreviewCard />

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
      </SafeAreaView>
    </LinearGradient>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    flex: 1,
  },
  planIcon: {
    marginRight: 8,
  },
  planText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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
