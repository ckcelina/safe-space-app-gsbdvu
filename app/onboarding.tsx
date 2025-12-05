
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle, SafeSpaceSubtitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingScreen() {
  const { theme } = useThemeContext();
  const { session, signIn, loading } = useAuth();
  const [tapCount, setTapCount] = useState(0);
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Skip onboarding if user is already authenticated
  useEffect(() => {
    if (!loading && session) {
      console.log('User already authenticated, skipping onboarding');
      router.replace('/(tabs)/(home)');
    }
  }, [session, loading]);

  const handleCreateSpace = () => {
    router.push('/theme-selection');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount >= 5) {
      setShowReviewerModal(true);
      setTapCount(0); // Reset counter
    }
  };

  const handleReviewerLogin = async () => {
    setIsLoggingIn(true);
    try {
      const { error } = await signIn('apple_reviewer@safespace.com', 'AppleTest123');
      
      if (error) {
        console.error('Reviewer login failed:', error);
        alert('Login failed. Please try again.');
      } else {
        console.log('Reviewer login successful');
        setShowReviewerModal(false);
        router.replace('/(tabs)/(home)');
      }
    } catch (error) {
      console.error('Unexpected error during reviewer login:', error);
      alert('An unexpected error occurred.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCloseModal = () => {
    setShowReviewerModal(false);
    setTapCount(0);
  };

  // Don't render onboarding if user is authenticated
  if (loading) {
    return null;
  }

  if (session) {
    return null;
  }

  return (
    <SafeSpaceScreen scrollable={true} keyboardAware={false} useGradient={true}>
      <View style={styles.content}>
        {/* App Icon - with hidden tap gesture */}
        <View style={styles.iconContainer}>
          <TouchableOpacity 
            onPress={handleLogoTap}
            activeOpacity={1}
            style={[styles.iconBackground, { backgroundColor: theme.card, borderColor: theme.primary }]}
          >
            <IconSymbol
              ios_icon_name="shield.fill"
              android_material_icon_name="shield"
              size={64}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <SafeSpaceTitle style={styles.title}>Safe Space</SafeSpaceTitle>

        {/* Subtitle */}
        <SafeSpaceSubtitle style={styles.subtitle}>
          Your private emotional sanctuary for healing and growth.
        </SafeSpaceSubtitle>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <SafeSpaceButton onPress={handleCreateSpace}>
            Create My Safe Space
          </SafeSpaceButton>

          <SafeSpaceLinkButton variant="outline" onPress={handleLogin}>
            Log In
          </SafeSpaceLinkButton>
        </View>
      </View>

      {/* Apple Reviewer Login Modal */}
      <Modal
        visible={showReviewerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Reviewer Login
            </Text>
            
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              For App Store Review team only.
            </Text>

            <View style={styles.modalButtons}>
              <SafeSpaceButton 
                onPress={handleReviewerLogin}
                loading={isLoggingIn}
                disabled={isLoggingIn}
              >
                Log In as Reviewer
              </SafeSpaceButton>

              <SafeSpaceLinkButton 
                variant="outline" 
                onPress={handleCloseModal}
                disabled={isLoggingIn}
              >
                Cancel
              </SafeSpaceLinkButton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeSpaceScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
    elevation: 6,
  },
  title: {
    fontSize: 42,
    marginBottom: 16,
  },
  subtitle: {
    maxWidth: 360,
    paddingHorizontal: 16,
    marginBottom: 48,
    fontSize: 17,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.24)',
    elevation: 12,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  modalButtons: {
    width: '100%',
  },
});
