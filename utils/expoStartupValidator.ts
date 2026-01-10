
/**
 * Expo Startup Validator
 * 
 * Validates that all critical Expo services are working correctly
 * and provides detailed diagnostics if issues are detected.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface StartupValidation {
  isValid: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  timestamp: Date;
}

class ExpoStartupValidator {
  /**
   * Run all startup validation checks
   */
  async validate(): Promise<StartupValidation> {
    console.log('[StartupValidator] Running startup validation checks...');

    const checks = [
      await this.checkExpoConstants(),
      await this.checkPlatform(),
      await this.checkDevMode(),
      await this.checkManifest(),
    ];

    const isValid = checks.every((check) => check.passed);

    const validation: StartupValidation = {
      isValid,
      checks,
      timestamp: new Date(),
    };

    // Log results
    console.log('[StartupValidator] Validation complete:', {
      isValid,
      passedChecks: checks.filter((c) => c.passed).length,
      totalChecks: checks.length,
    });

    checks.forEach((check) => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`[StartupValidator] ${icon} ${check.name}: ${check.message}`);
    });

    return validation;
  }

  /**
   * Check Expo Constants
   */
  private async checkExpoConstants() {
    try {
      const hasConstants = !!Constants.expoConfig;
      return {
        name: 'Expo Constants',
        passed: hasConstants,
        message: hasConstants
          ? `Expo config loaded (${Constants.expoConfig?.name})`
          : 'Expo config not found',
      };
    } catch (error) {
      return {
        name: 'Expo Constants',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check Platform
   */
  private async checkPlatform() {
    try {
      const platform = Platform.OS;
      const version = Platform.Version;
      return {
        name: 'Platform',
        passed: true,
        message: `${platform} ${version}`,
      };
    } catch (error) {
      return {
        name: 'Platform',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check Dev Mode
   */
  private async checkDevMode() {
    try {
      const isDev = __DEV__;
      return {
        name: 'Development Mode',
        passed: true,
        message: isDev ? 'Development' : 'Production',
      };
    } catch (error) {
      return {
        name: 'Development Mode',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check Manifest
   */
  private async checkManifest() {
    try {
      const manifest = Constants.expoConfig;
      const hasManifest = !!manifest;
      return {
        name: 'App Manifest',
        passed: hasManifest,
        message: hasManifest
          ? `Version ${manifest?.version || 'unknown'}`
          : 'Manifest not found',
      };
    } catch (error) {
      return {
        name: 'App Manifest',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Log startup diagnostics
   */
  logDiagnostics(): void {
    console.log('[StartupValidator] === EXPO STARTUP DIAGNOSTICS ===');
    console.log('[StartupValidator] Expo SDK:', Constants.expoConfig?.sdkVersion || 'unknown');
    console.log('[StartupValidator] App Name:', Constants.expoConfig?.name || 'unknown');
    console.log('[StartupValidator] App Version:', Constants.expoConfig?.version || 'unknown');
    console.log('[StartupValidator] Platform:', Platform.OS, Platform.Version);
    console.log('[StartupValidator] Dev Mode:', __DEV__);
    console.log('[StartupValidator] Timestamp:', new Date().toISOString());
    console.log('[StartupValidator] ================================');
  }
}

// Singleton instance
export const startupValidator = new ExpoStartupValidator();
