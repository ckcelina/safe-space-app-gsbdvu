
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ThemeKey } from '@/contexts/ThemeContext';

interface ThemeOptionCardProps {
  theme: {
    id: ThemeKey;
    name: string;
    color: string;
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
          backgroundColor: '#FFFFFF',
        },
        selected && styles.selectedShadow,
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  selectedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {
        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      default: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
      },
    }),
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
