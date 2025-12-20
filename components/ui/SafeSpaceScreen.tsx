
import React, { ReactNode } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SafeSpaceScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  keyboardAware?: boolean;
  useGradient?: boolean;
  contentContainerStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeSpaceScreen({
  children,
  scrollable = true,
  keyboardAware = true,
  useGradient = true,
  contentContainerStyle,
  edges = ['top', 'bottom'],
}: SafeSpaceScreenProps) {
  const { theme } = useThemeContext();

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  const wrappedContent = keyboardAware ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
      keyboardVerticalOffset={0}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  if (useGradient) {
    return (
      <LinearGradient
        colors={[theme.background, theme.card]}
        style={styles.fullScreenContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView 
          style={[styles.safeArea, { backgroundColor: 'transparent' }]} 
          edges={edges}
        >
          {wrappedContent}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.fullScreenContainer, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {wrappedContent}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Math.min(SCREEN_WIDTH * 0.06, 24),
    paddingVertical: SCREEN_HEIGHT * 0.025,
  },
  content: {
    flex: 1,
    paddingHorizontal: Math.min(SCREEN_WIDTH * 0.06, 24),
    paddingVertical: SCREEN_HEIGHT * 0.025,
  },
});
