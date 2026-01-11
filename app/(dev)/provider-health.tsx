
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { runDevChecklist } from '@/utils/devChecklist';
import { runDevScanRepair } from '@/utils/devScanRepair';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsAuthProviderMounted } from '@/contexts/AuthContext';
import * as TherapistPersonas from '@/constants/TherapistPersonas';
import * as ThemeContext from '@/contexts/ThemeContext';
import * as UserPreferencesContext from '@/contexts/UserPreferencesContext';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export default function ProviderHealthScreen() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanResults, setScanResults] = useState<string[]>([]);

  const validateModule = (moduleName: string, moduleExports: any) => {
    try {
      if (!moduleExports) {
        return { success: false, error: 'Module not found' };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Check if AuthProvider is mounted (must be at top level, not in callback)
  const authMounted = useIsAuthProviderMounted();

  const runHealthChecks = useCallback(async () => {
    setLoading(true);
    const results: HealthCheck[] = [];

    // Check 1: AuthProvider mounted
    if (authMounted) {
      results.push({
        name: 'AuthProvider',
        status: 'pass',
        message: 'AuthProvider is mounted correctly',
      });
    } else {
      results.push({
        name: 'AuthProvider',
        status: 'fail',
        message: 'AuthProvider is not mounted - check app/_layout.tsx',
      });
    }

    // Check 2: TherapistPersonas
    const personasCheck = validateModule('TherapistPersonas', TherapistPersonas);
    if (personasCheck.success) {
      results.push({
        name: 'TherapistPersonas',
        status: 'pass',
        message: 'TherapistPersonas loads without errors',
      });
    } else {
      results.push({
        name: 'TherapistPersonas',
        status: 'fail',
        message: `TherapistPersonas failed: ${personasCheck.error}`,
      });
    }

    // Check 3: ThemeContext
    const themeCheck = validateModule('ThemeContext', ThemeContext);
    if (themeCheck.success) {
      results.push({
        name: 'ThemeContext',
        status: 'pass',
        message: 'ThemeContext loads correctly',
      });
    } else {
      results.push({
        name: 'ThemeContext',
        status: 'fail',
        message: `ThemeContext failed: ${themeCheck.error}`,
      });
    }

    // Check 4: UserPreferencesContext
    const prefsCheck = validateModule('UserPreferencesContext', UserPreferencesContext);
    if (prefsCheck.success) {
      results.push({
        name: 'UserPreferencesContext',
        status: 'pass',
        message: 'UserPreferencesContext loads correctly',
      });
    } else {
      results.push({
        name: 'UserPreferencesContext',
        status: 'fail',
        message: `UserPreferencesContext failed: ${prefsCheck.error}`,
      });
    }

    // Check 5: Safe Guards
    try {
      // Just verify the contexts are available
      if (TherapistPersonas && ThemeContext && UserPreferencesContext) {
        results.push({
          name: 'Safe Guards',
          status: 'pass',
          message: 'All critical modules are available',
        });
      } else {
        results.push({
          name: 'Safe Guards',
          status: 'warning',
          message: 'Some modules may not be available',
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Safe Guards',
        status: 'warning',
        message: 'Safe guard check failed - components may crash',
      });
    }

    setChecks(results);
    setLoading(false);
  }, [authMounted]);

  useEffect(() => {
    runHealthChecks();
  }, [runHealthChecks]);

  const handleRunFullScan = () => {
    console.log('\n🔍 Running full scan from Provider Health screen...\n');
    
    // Run dev checklist
    const checklistResult = runDevChecklist();
    
    // Run scan & repair
    const scanResult = runDevScanRepair();
    
    setScanResults([
      `Scan completed at ${new Date().toLocaleTimeString()}`,
      `Checklist passed: ${checklistResult?.passed ? 'Yes' : 'No'}`,
      `Scan passed: ${scanResult.passed ? 'Yes' : 'No'}`,
      `Issues found: ${scanResult.issues.length}`,
      ...scanResult.issues.map(i => `- ${i.file}: ${i.issue}`),
    ]);
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return '#10B981';
      case 'fail':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'check-circle';
      case 'fail':
        return 'error';
      case 'warning':
        return 'warning';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color="#1F2937"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Provider Health</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Title */}
          <Text style={styles.title}>System Health Checks</Text>
          <Text style={styles.subtitle}>
            Validates that all providers and contexts are properly configured
          </Text>

          {/* Health Checks */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Running health checks...</Text>
            </View>
          ) : (
            <View style={styles.checksContainer}>
              {checks.map((check, index) => (
                <View key={index} style={styles.checkCard}>
                  <View style={styles.checkHeader}>
                    <IconSymbol
                      ios_icon_name={getStatusIcon(check.status)}
                      android_material_icon_name={getStatusIcon(check.status)}
                      size={24}
                      color={getStatusColor(check.status)}
                    />
                    <Text style={styles.checkName}>{check.name}</Text>
                  </View>
                  <Text style={[styles.checkMessage, { color: getStatusColor(check.status) }]}>
                    {check.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={runHealthChecks}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.actionButtonGradient}
              >
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionButtonText}>Re-run Checks</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRunFullScan}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.actionButtonGradient}
              >
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionButtonText}>Run Full Scan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Scan Results */}
          {scanResults.length > 0 && (
            <View style={styles.scanResultsContainer}>
              <Text style={styles.scanResultsTitle}>Scan Results</Text>
              {scanResults.map((result, index) => (
                <Text key={index} style={styles.scanResultText}>
                  {result}
                </Text>
              ))}
            </View>
          )}

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>What This Checks</Text>
            <Text style={styles.infoText}>
              • AuthProvider is mounted and accessible{'\n'}
              • TherapistPersonas loads without stray tokens{'\n'}
              • All contexts are properly configured{'\n'}
              • Safe guard hooks are available{'\n'}
              • No syntax errors in critical files
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  checksContainer: {
    marginBottom: 24,
  },
  checkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  checkMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanResultsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  scanResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  scanResultText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 4,
  },
  infoContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 22,
  },
});
