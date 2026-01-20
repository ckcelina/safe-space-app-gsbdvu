
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeSpaceScreen } from '@/components/ui/SafeSpaceScreen';
import { SafeSpaceTitle, SafeSpaceSubtitle } from '@/components/ui/SafeSpaceText';
import { SafeSpaceButton } from '@/components/ui/SafeSpaceButton';
import { SafeSpaceLinkButton } from '@/components/ui/SafeSpaceLinkButton';
import { SafeSpaceLogo } from '@/components/SafeSpaceLogo';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
        {/* App Icon - with hidden tap gesture - now using gradient version like widget/app icon */}
        <View style={styles.iconContainer}>
          <TouchableOpacity 
            onPress={handleLogoTap}
            activeOpacity={1}
          >
            <SafeSpaceLogo size={Math.min(SCREEN_WIDTH * 0.3, 120)} useGradient={true} />
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
    paddingVertical: SCREEN_HEIGHT * 0.05,
    minHeight: SCREEN_HEIGHT * 0.7,
  },
  iconContainer: {
    marginBottom: SCREEN_HEIGHT * 0.04,
  },
  title: {
    fontSize: Math.min(SCREEN_WIDTH * 0.11, 42),
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  subtitle: {
    maxWidth: Math.min(SCREEN_WIDTH * 0.85, 360),
    paddingHorizontal: 16,
    marginBottom: SCREEN_HEIGHT * 0.06,
    fontSize: Math.min(SCREEN_WIDTH * 0.045, 17),
    lineHeight: Math.min(SCREEN_WIDTH * 0.068, 26),
  },
  buttonContainer: {
    width: '100%',
    maxWidth: Math.min(SCREEN_WIDTH * 0.9, 400),
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
    padding: Math.min(SCREEN_WIDTH * 0.08, 32),
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.24)',
    elevation: 12,
  },
  modalTitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.07, 28),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    textAlign: 'center',
    marginBottom: Math.min(SCREEN_HEIGHT * 0.04, 32),
    lineHeight: 24,
  },
  modalButtons: {
    width: '100%',
  },
});
