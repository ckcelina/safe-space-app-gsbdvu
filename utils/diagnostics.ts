
/**
 * Expo Server Diagnostics
 * 
 * Comprehensive diagnostic tool for troubleshooting Expo server issues.
 * Collects system information, health status, and provides recommendations.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Network from 'expo-network';
import { serverHealthMonitor } from './expoServerHealth';
import { metroConnectionGuard } from './metroConnectionGuard';

interface DiagnosticReport {
  timestamp: string;
  platform: {
    os: string;
    version: string | number;
  };
  app: {
    name: string;
    version: string;
    sdkVersion: string;
  };
  network: {
    type: string;
    isConnected: boolean;
    isInternetReachable: boolean;
  };
  serverHealth: {
    isHealthy: boolean;
    errors: Array<string>;
    reconnectAttempts: number;
    lastSuccessfulConnection: string | null;
  };
  metroConnection: {
    isRecovering: boolean;
    connectionAttempts: number;
    errorPatterns: Array<[string, number]>;
    timeSinceLastSuccess: number | null;
  };
  recommendations: Array<string>;
}

class Diagnostics {
  /**
   * Generate comprehensive diagnostic report
   */
  async generateReport(): Promise<DiagnosticReport> {
    console.log('[Diagnostics] Generating diagnostic report...');

    const networkState = await Network.getNetworkStateAsync();
    const healthStatus = serverHealthMonitor.getHealthStatus();
    const metroStatus = metroConnectionGuard.getStatus();

    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      platform: {
        os: Platform.OS,
        version: Platform.Version,
      },
      app: {
        name: Constants.expoConfig?.name || 'Unknown',
        version: Constants.expoConfig?.version || 'Unknown',
        sdkVersion: Constants.expoConfig?.sdkVersion || 'Unknown',
      },
      network: {
        type: networkState.type,
        isConnected: networkState.isConnected || false,
        isInternetReachable: networkState.isInternetReachable || false,
      },
      serverHealth: {
        isHealthy: healthStatus.isHealthy,
        errors: healthStatus.errors,
        reconnectAttempts: healthStatus.reconnectAttempts,
        lastSuccessfulConnection: healthStatus.lastSuccessfulConnection?.toISOString() || null,
      },
      metroConnection: {
        isRecovering: metroStatus.isRecovering,
        connectionAttempts: metroStatus.connectionAttempts,
        errorPatterns: metroStatus.errorPatterns,
        timeSinceLastSuccess: metroStatus.timeSinceLastSuccess,
      },
      recommendations: this.generateRecommendations(healthStatus, metroStatus, networkState),
    };

    return report;
  }

  /**
   * Generate recommendations based on current state
   */
  private generateRecommendations(
    healthStatus: any,
    metroStatus: any,
    networkState: Network.NetworkState
  ): string[] {
    const recommendations: string[] = [];

    // Network issues
    if (!networkState.isConnected) {
      recommendations.push('❌ No network connection. Check your WiFi or cellular connection.');
    } else if (!networkState.isInternetReachable) {
      recommendations.push('⚠️ Internet unreachable. Check your router or cellular data.');
    }

    // Health issues
    if (!healthStatus.isHealthy) {
      recommendations.push('⚠️ Server health check failed. Try restarting the Expo server.');
    }

    // Metro connection issues
    if (metroStatus.isRecovering) {
      recommendations.push('🔄 Metro connection recovering. Please wait...');
    }

    if (metroStatus.connectionAttempts > 3) {
      recommendations.push('⚠️ Multiple connection attempts. Consider running: npm run reset');
    }

    // Error patterns
    if (metroStatus.errorPatterns.length > 0) {
      const patterns = metroStatus.errorPatterns.map(([pattern, count]) => `${pattern} (${count}x)`);
      recommendations.push(`🔍 Error patterns detected: ${patterns.join(', ')}`);
    }

    // Time since last success
    if (metroStatus.timeSinceLastSuccess && metroStatus.timeSinceLastSuccess > 60000) {
      const minutes = Math.floor(metroStatus.timeSinceLastSuccess / 60000);
      recommendations.push(
        `⏰ No successful connection for ${minutes} minutes. Try: npm run dev:safe`
      );
    }

    // All good
    if (recommendations.length === 0) {
      recommendations.push('✅ Everything looks good! No issues detected.');
    }

    return recommendations;
  }

  /**
   * Print diagnostic report to console
   */
  async printReport(): Promise<void> {
    const report = await this.generateReport();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              EXPO SERVER DIAGNOSTIC REPORT                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('📅 Timestamp:', report.timestamp);
    console.log('\n📱 Platform:');
    console.log('  OS:', report.platform.os);
    console.log('  Version:', report.platform.version);

    console.log('\n📦 App:');
    console.log('  Name:', report.app.name);
    console.log('  Version:', report.app.version);
    console.log('  SDK:', report.app.sdkVersion);

    console.log('\n🌐 Network:');
    console.log('  Type:', report.network.type);
    console.log('  Connected:', report.network.isConnected ? '✅' : '❌');
    console.log('  Internet:', report.network.isInternetReachable ? '✅' : '❌');

    console.log('\n💚 Server Health:');
    console.log('  Status:', report.serverHealth.isHealthy ? '✅ Healthy' : '❌ Unhealthy');
    console.log('  Errors:', report.serverHealth.errors.length);
    if (report.serverHealth.errors.length > 0) {
      report.serverHealth.errors.forEach((error) => {
        console.log('    -', error);
      });
    }
    console.log('  Reconnect Attempts:', report.serverHealth.reconnectAttempts);
    console.log('  Last Success:', report.serverHealth.lastSuccessfulConnection || 'Never');

    console.log('\n🔌 Metro Connection:');
    console.log('  Status:', report.metroConnection.isRecovering ? '🔄 Recovering' : '✅ Stable');
    console.log('  Connection Attempts:', report.metroConnection.connectionAttempts);
    if (report.metroConnection.errorPatterns.length > 0) {
      console.log('  Error Patterns:');
      report.metroConnection.errorPatterns.forEach(([pattern, count]) => {
        console.log(`    - ${pattern}: ${count}x`);
      });
    }
    if (report.metroConnection.timeSinceLastSuccess !== null) {
      const seconds = Math.floor(report.metroConnection.timeSinceLastSuccess / 1000);
      console.log('  Time Since Last Success:', `${seconds}s`);
    }

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach((rec) => {
      console.log('  ', rec);
    });

    console.log('\n╚═══════════════════════════════════════════════════════════════╝\n');
  }

  /**
   * Export report as JSON string
   */
  async exportReport(): Promise<string> {
    const report = await this.generateReport();
    return JSON.stringify(report, null, 2);
  }
}

// Singleton instance
export const diagnostics = new Diagnostics();

/**
 * Quick diagnostic check (call from console)
 */
export async function runDiagnostics(): Promise<void> {
  await diagnostics.printReport();
}

/**
 * Export diagnostic report
 */
export async function exportDiagnostics(): Promise<string> {
  return await diagnostics.exportReport();
}
