
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

  const formatLastMessagePreview = (message: string) => {
    if (message.length > 50) {
      return message.substring(0, 50) + '...';
    }
    return message;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: theme.background }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>
            {person.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {person.name}
          </Text>
          <Text style={[styles.relationship, { color: theme.textSecondary }]}>
            {person.relationship_type}
          </Text>
          <Text
            style={[styles.lastMessage, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {formatLastMessagePreview(person.lastMessage || 'No messages yet')}
          </Text>
        </View>

        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron_right"
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  relationship: {
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  lastMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
