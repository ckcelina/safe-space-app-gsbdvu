
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeType } from '@/types/database.types';

interface ThemeOptionCardProps {
  theme: {
    id: ThemeType;
    name: string;
    color: string;
    gradient: string[];
    description: string;
  };
  selected: boolean;
  onPress: () => void;
}

export function ThemeOptionCard({ theme, selected, onPress }: ThemeOptionCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderColor: selected ? theme.color : '#E0E0E0',
          borderWidth: selected ? 3 : 2,
          backgroundColor: selected ? '#FFFFFF' : '#F9F9F9',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.colorCircle, { backgroundColor: theme.color }]} />
      
      <View style={styles.info}>
        <Text style={styles.name}>{theme.name}</Text>
        <Text style={styles.description}>{theme.description}</Text>
      </View>

      {selected && (
        <View style={[styles.checkmark, { backgroundColor: theme.color }]}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
    elevation: 3,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001529',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#8C8C8C',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
