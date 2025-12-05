
import React, { ReactNode } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/contexts/ThemeContext';

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
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={edges}>
          {wrappedContent}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {wrappedContent}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
});
