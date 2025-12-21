
import { Platform, View, Text, StyleSheet } from 'react-native';

// Early diagnostic logging
console.log('=== APP STARTUP DIAGNOSTICS ===');
console.log('Platform:', Platform.OS);
console.log('React Native version:', Platform.Version);

// Check if expo-constants is available
let Constants;
try {
  Constants = require('expo-constants').default;
  console.log('expo-constants loaded:', !!Constants);
  console.log('Constants.expoConfig:', !!Constants?.expoConfig);
} catch (error) {
  console.error('Failed to load expo-constants:', error);
}

// If Constants is missing or broken, show error screen
if (!Constants || !Constants.expoConfig) {
  console.error('CRITICAL: expo-constants module is missing or incomplete');
  
  const { registerRootComponent } = require('expo');
  
  function ErrorScreen() {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Configuration Error</Text>
        <Text style={styles.errorText}>
          The app cannot start because native modules are not properly initialized.
        </Text>
        <Text style={styles.errorText}>
          This usually means:
        </Text>
        <Text style={styles.errorBullet}>• The Expo Go app needs to be restarted</Text>
        <Text style={styles.errorBullet}>• The development server cache needs to be cleared</Text>
        <Text style={styles.errorBullet}>• A custom dev client needs to be rebuilt</Text>
        <Text style={styles.errorText}>
          {'\n'}Please try:
        </Text>
        <Text style={styles.errorStep}>1. Close Expo Go completely</Text>
        <Text style={styles.errorStep}>2. Run: npm run start:clean</Text>
        <Text style={styles.errorStep}>3. Scan the QR code again</Text>
      </View>
    );
  }
  
  registerRootComponent(ErrorScreen);
} else {
  // Constants is available, proceed with normal app entry
  console.log('✓ All native modules loaded successfully');
  console.log('=== STARTING EXPO ROUTER ===');
  require('expo-router/entry');
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorBullet: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 16,
    marginBottom: 8,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  errorStep: {
    fontSize: 16,
    color: '#4A90E2',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
});
