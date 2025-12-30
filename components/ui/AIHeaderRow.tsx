
import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { useThemeContext } from '@/contexts/ThemeContext';

interface AIHeaderRowProps {
  therapistName?: string;
  therapistAvatarSource?: ImageSourcePropType;
  theme?: any; // Optional override
}

export function AIHeaderRow({ therapistName, therapistAvatarSource }: AIHeaderRowProps) {
  const { theme } = useThemeContext();
  
  const displayName = therapistName || 'Safe Space';
  
  return (
    <View style={styles.container}>
      {therapistAvatarSource ? (
        <Image
          source={therapistAvatarSource}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { borderColor: theme.textSecondary + '40' }]} />
      )}
      <Text style={[styles.name, { color: theme.textSecondary }]}>
        {displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 36, // Align with left edge of AI bubble (28px icon + 8px margin)
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});
