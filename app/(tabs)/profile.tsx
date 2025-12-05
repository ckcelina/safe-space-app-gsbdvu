
import React from 'react';
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
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const { currentUser, email, role, signOut } = useAuth();
  const { colors, theme, setTheme } = useThemeContext();

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

  const handleChangeTheme = () => {
    Alert.alert(
      'Change Theme',
      'Select a theme',
      [
        {
          text: 'Ocean Blue',
          onPress: () => setTheme('ocean-blue'),
        },
        {
          text: 'Soft Rose',
          onPress: () => setTheme('soft-rose'),
        },
        {
          text: 'Forest Green',
          onPress: () => setTheme('forest-green'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'premium':
        return '#FFD700';
      case 'admin':
        return '#FF6B6B';
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="envelope.fill"
              android_material_icon_name="email"
              size={24}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Email
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {email || 'Not available'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={24}
              color={getRoleBadgeColor()}
            />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Plan
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {role === 'free' && (
          <View style={[styles.upgradeCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
            <Text style={styles.upgradeText}>
              Get unlimited conversations and advanced features
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: '#FFFFFF' }]}
              onPress={() => Alert.alert('Coming Soon', 'Premium features will be available soon!')}
            >
              <Text style={[styles.upgradeButtonText, { color: colors.primary }]}>
                Learn More
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={handleChangeTheme}
          >
            <IconSymbol
              ios_icon_name="paintbrush.fill"
              android_material_icon_name="palette"
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Change Theme
            </Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
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
  upgradeCard: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    opacity: 0.9,
  },
  upgradeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
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
  settingText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
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
});
