
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useBiometricLock } from '@/contexts/BiometricLockContext';

export const BiometricLockScreen: React.FC = () => {
  const { theme } = useThemeContext();
  const { isLocked, authenticate, unlock } = useBiometricLock();

  const handleTryAgain = async () => {
    const success = await authenticate();
    if (success) {
      unlock();
    }
  };

  if (!isLocked) return null;

  return (
    <Modal visible={isLocked} animationType="fade" transparent={false}>
      <LinearGradient colors={theme.gradientColors} style={styles.container}>
        <View style={styles.content}>
          <IconSymbol 
            ios_icon_name="lock.fill" 
            android_material_icon_name="lock" 
            size={80} 
            color={theme.textPrimary} 
          />
          <Text style={[styles.title, { color: theme.textPrimary }]}>Safe Space is Locked</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Authenticate to continue
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.buttonBackground }]}
            onPress={handleTryAgain}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  button: {
    marginTop: 40,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
