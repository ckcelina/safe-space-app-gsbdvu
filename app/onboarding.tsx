
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';

export default function OnboardingScreen() {
  const handleCreateSpace = () => {
    router.push('/theme-selection');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <LinearGradient
      colors={['#E6F7FF', '#FFFFFF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Shield Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <IconSymbol
                ios_icon_name="shield.fill"
                android_material_icon_name="shield"
                size={64}
                color="#1890FF"
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Safe Space</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Your private emotional sanctuary. A place to talk, reflect, heal, and understand your relationships — including the one with yourself.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateSpace}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Create My Safe Space</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer to push disclaimer to bottom */}
          <View style={styles.spacer} />

          {/* Footer Disclaimer */}
          <Text style={styles.disclaimer}>
            By continuing, you agree this is a supportive AI coach, not a substitute for professional care.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#E6F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1890FF',
    boxShadow: '0px 4px 12px rgba(24, 144, 255, 0.2)',
    elevation: 4,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#001529',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 400,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#1890FF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(24, 144, 255, 0.3)',
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1890FF',
  },
  secondaryButtonText: {
    color: '#1890FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  disclaimer: {
    fontSize: 12,
    color: '#8C8C8C',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 350,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
