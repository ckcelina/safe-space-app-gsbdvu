
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

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: theme.background }]}>
          <IconSymbol
            ios_icon_name="person.circle.fill"
            android_material_icon_name="account_circle"
            size={32}
            color={theme.primary}
          />
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

        <IconSymbol
          ios_icon_name="ellipsis"
          android_material_icon_name="more_vert"
          size={24}
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
