
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const { email, role, signOut } = useAuth();
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
            router.replace('/login');
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Email
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>{email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Plan
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.card }]}
          onPress={handleChangeTheme}
        >
          <IconSymbol
            ios_icon_name="paintbrush.fill"
            android_material_icon_name="palette"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Change Theme
          </Text>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron_right"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.card }]}
          onPress={handleSignOut}
        >
          <IconSymbol
            ios_icon_name="rectangle.portrait.and.arrow.right"
            android_material_icon_name="logout"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Safe Space v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            A safe place to talk
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoRow: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
