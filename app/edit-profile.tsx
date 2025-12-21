
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';

// Prevent static generation for this route
export const dynamic = 'force-dynamic';

export default function EditProfileScreen() {
  const { email, role } = useAuth();
  const { theme } = useThemeContext();

  const handleBack = () => {
    router.back();
  };

  const getPlanBadge = () => {
    if (role === 'premium' || role === 'admin') {
      return 'Premium';
    }
    return 'Free';
  };

  const getPlanBadgeColor = () => {
    if (role === 'premium' || role === 'admin') {
      return '#FFD700';
    }
    return theme.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Edit Profile
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.iconBackground, { backgroundColor: theme.card, borderColor: theme.primary }]}>
          <IconSymbol
            ios_icon_name="person.circle.fill"
            android_material_icon_name="account_circle"
            size={64}
            color={theme.primary}
          />
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Email
            </Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {email || 'Not available'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Plan
            </Text>
            <View style={[styles.planBadge, { backgroundColor: theme.background }]}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={14}
                color={getPlanBadgeColor()}
              />
              <Text style={[styles.planText, { color: getPlanBadgeColor() }]}>
                {getPlanBadge()}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.placeholderCard, { backgroundColor: theme.card }]}>
          <IconSymbol
            ios_icon_name="wrench.and.screwdriver.fill"
            android_material_icon_name="construction"
            size={48}
            color={theme.textSecondary}
          />
          <Text style={[styles.placeholderTitle, { color: theme.textPrimary }]}>
            Coming Soon
          </Text>
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
            Profile editing features will be available in a future update.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 32,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  infoCard: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  planText: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderCard: {
    width: '100%',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
