
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { Person } from '@/types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PersonCardProps {
  person: Person & { lastMessage?: string };
  onPress: () => void;
  isTopic?: boolean;
}

export function PersonCard({ person, onPress, isTopic = false }: PersonCardProps) {
  const { theme } = useThemeContext();

  // Get first letter of name for avatar with null check
  const initial = person.name && person.name.length > 0 ? person.name.charAt(0).toUpperCase() : '?';

  // Determine the label to show
  let label = isTopic ? 'Topic' : person.relationship_type;
  
  // If it's a topic with a context label, show "Topic – Context"
  if (isTopic && person.context_label) {
    label = `Topic – ${person.context_label}`;
  }

  // Build display name with context label if present
  const displayName = person.context_label && isTopic
    ? `${person.name} – ${person.context_label}`
    : person.name || 'Unknown';

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
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          {label && (
            <Text style={[styles.relationship, { color: theme.textSecondary }]} numberOfLines={1}>
              {label}
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
    fontSize: Math.min(SCREEN_WIDTH * 0.055, 22),
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: Math.min(SCREEN_WIDTH * 0.045, 18),
    fontWeight: '600',
    marginBottom: 4,
  },
  relationship: {
    fontSize: Math.min(SCREEN_WIDTH * 0.035, 14),
    textTransform: 'capitalize',
  },
});
