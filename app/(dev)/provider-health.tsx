
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@react-navigation/native';
import { useWidget } from '@/contexts/WidgetContext';

/**
 * DEV-ONLY Provider Health Debug Screen
 * 
 * Access via: /(dev)/provider-health
 * Shows real-time status of all context providers
 * Hidden in production builds
 */
export default function ProviderHealthScreen() {
  // CRITICAL: Call all hooks at the TOP LEVEL before any conditional logic
  // This is required by React Hooks rules - hooks cannot be called conditionally
  
  let authStatus = 'MISSING';
  let authDetails: any = {};
  let authError: Error | null = null;
  
  try {
    const auth = useAuth();
    authStatus = 'OK';
    authDetails = {
      userId: auth.userId || 'null',
      email: auth.email || 'null',
      role: auth.role || 'null',
      isPremium: String(auth.isPremium),
      loading: String(auth.loading),
      hasSession: auth.session ? 'true' : 'false',
      hasSignIn: typeof auth.signInWithEmail === 'function' ? 'true' : 'false',
      hasSignOut: typeof auth.signOut === 'function' ? 'true' : 'false',
    };
  } catch (error) {
    authStatus = 'MISSING';
    authError = error as Error;
    authDetails = { error: (error as Error).message };
  }

  let widgetStatus = 'MISSING';
  let widgetDetails: any = {};
  let widgetError: Error | null = null;
  
  try {
    const widget = useWidget();
    widgetStatus = 'OK';
    widgetDetails = {
      hasContext: widget ? 'true' : 'false',
      hasRefreshWidget: typeof widget?.refreshWidget === 'function' ? 'true' : 'false',
    };
  } catch (error) {
    widgetStatus = 'MISSING';
    widgetError = error as Error;
    widgetDetails = { error: (error as Error).message };
  }

  let themeStatus = 'MISSING';
  let themeDetails: any = {};
  let themeError: Error | null = null;
  
  try {
    const theme = useTheme();
    themeStatus = 'OK';
    themeDetails = {
      dark: String(theme.dark),
      primaryColor: theme.colors.primary,
      backgroundColor: theme.colors.background,
      textColor: theme.colors.text,
    };
  } catch (error) {
    themeStatus = 'MISSING';
    themeError = error as Error;
    themeDetails = { error: (error as Error).message };
  }

  // NOW we can do conditional rendering after all hooks have been called
  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAvailable}>
          <Text style={styles.notAvailableText}>
            🔒 Not available in production
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Provider Health</Text>
          <Text style={styles.subtitle}>Dev-only diagnostic screen</Text>
          <Text style={styles.subtitle}>Access: /(dev)/provider-health</Text>
        </View>

        {/* Auth Provider Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AuthProvider</Text>
            <View
              style={[
                styles.statusBadge,
                authStatus === 'OK' ? styles.statusOk : styles.statusMissing,
              ]}
            >
              <Text style={styles.statusText}>{authStatus}</Text>
            </View>
          </View>
          {Object.entries(authDetails).map(([key, value]) => (
            <View key={key} style={styles.detailRow}>
              <Text style={styles.detailKey}>{key}:</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {String(value)}
              </Text>
            </View>
          ))}
        </View>

        {/* Theme Provider Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ThemeProvider</Text>
            <View
              style={[
                styles.statusBadge,
                themeStatus === 'OK' ? styles.statusOk : styles.statusMissing,
              ]}
            >
              <Text style={styles.statusText}>{themeStatus}</Text>
            </View>
          </View>
          {Object.entries(themeDetails).map(([key, value]) => (
            <View key={key} style={styles.detailRow}>
              <Text style={styles.detailKey}>{key}:</Text>
              <Text style={styles.detailValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        {/* Widget Provider Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>WidgetProvider</Text>
            <View
              style={[
                styles.statusBadge,
                widgetStatus === 'OK' ? styles.statusOk : styles.statusMissing,
              ]}
            >
              <Text style={styles.statusText}>{widgetStatus}</Text>
            </View>
          </View>
          {Object.entries(widgetDetails).map(([key, value]) => (
            <View key={key} style={styles.detailRow}>
              <Text style={styles.detailKey}>{key}:</Text>
              <Text style={styles.detailValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        {/* System Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Info</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Platform:</Text>
            <Text style={styles.detailValue}>{Platform.OS}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>__DEV__:</Text>
            <Text style={styles.detailValue}>{String(__DEV__)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Version:</Text>
            <Text style={styles.detailValue}>{Platform.Version}</Text>
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>💡 How to Use</Text>
          <Text style={styles.instructionsText}>
            - This screen shows whether all context providers are properly mounted
          </Text>
          <Text style={styles.instructionsText}>
            - "OK" = Provider is working correctly
          </Text>
          <Text style={styles.instructionsText}>
            - "MISSING" = Provider is not accessible (check _layout.tsx)
          </Text>
          <Text style={styles.instructionsText}>
            - Access this screen by typing: /(dev)/provider-health
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back to App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOk: {
    backgroundColor: '#10b981',
  },
  statusMissing: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  detailKey: {
    fontSize: 14,
    color: '#888',
    width: 140,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  instructions: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 6,
    lineHeight: 20,
  },
  notAvailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAvailableText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
