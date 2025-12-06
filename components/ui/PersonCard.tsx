
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { Person } from '@/types/database.types';

interface PersonCardProps {
  person: Person & { lastMessage?: string };
  onPress: () => void;
}

export function PersonCard({ person, onPress }: PersonCardProps) {
  const { theme } = useThemeContext();

  // Get first letter of name for avatar
  const initial = person.name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Avatar with Initial */}
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.buttonText }]}>
            {initial}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {person.name}
          </Text>
          {person.relationship_type && (
            <Text style={[styles.relationship, { color: theme.textSecondary }]}>
              {person.relationship_type}
            </Text>
          )}
        </View>

        {/* Chevron Right Icon */}
        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="arrow_forward"
          size={20}
          color={theme.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  relationship: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
});
