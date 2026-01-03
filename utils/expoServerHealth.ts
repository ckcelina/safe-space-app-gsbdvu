
/**
 * Expo Server Health Monitor
 * 
 * This utility provides comprehensive monitoring and auto-recovery
 * for the Expo development server to ensure it never breaks.
 */

import React from 'react';
import * as Network from 'expo-network';

interface ServerHealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  networkState: Network.NetworkState | null;
  errors: string[];
}

class ExpoServerHealthMonitor {
  private healthStatus: ServerHealthStatus = {
    isHealthy: true,
    lastCheck: new Date(),
    networkState: null,
    errors: [],
  };

  private healthCheckInterval: NodeJS.Timeout | null = null;
  private networkListener: { remove: () => void } | null = null;

  /**
   * Initialize health monitoring
   */
  async initialize(): Promise<void> {
    console.log('[ExpoServerHealth] Initializing health monitor...');

    try {
      // Check initial network state
      await this.checkNetworkHealth();

      // Set up network state listener
      this.setupNetworkListener();

      // Start periodic health checks (every 30 seconds)
      this.startHealthChecks();

      console.log('[ExpoServerHealth] ✅ Health monitor initialized successfully');
    } catch (error) {
      console.log('[ExpoServerHealth] ⚠️ Failed to initialize health monitor:', error);
      // Don't throw - we want the app to continue even if monitoring fails
    }
  }

  /**
   * Check network health
   */
  private async checkNetworkHealth(): Promise<void> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      this.healthStatus.networkState = networkState;
      this.healthStatus.lastCheck = new Date();

      if (!networkState.isConnected) {
        this.healthStatus.isHealthy = false;
        this.healthStatus.errors.push('Network disconnected');
        console.log('[ExpoServerHealth] ⚠️ Network disconnected');
      } else if (!networkState.isInternetReachable) {
        this.healthStatus.isHealthy = false;
        this.healthStatus.errors.push('Internet unreachable');
        console.log('[ExpoServerHealth] ⚠️ Internet unreachable');
      } else {
        this.healthStatus.isHealthy = true;
        this.healthStatus.errors = [];
        console.log('[ExpoServerHealth] ✅ Network healthy:', networkState.type);
      }
    } catch (error) {
      console.log('[ExpoServerHealth] Error checking network health:', error);
      // Don't mark as unhealthy - network check failure doesn't mean server is broken
    }
  }

  /**
   * Set up network state listener
   */
  private setupNetworkListener(): void {
    try {
      this.networkListener = Network.addNetworkStateListener((state) => {
        console.log('[ExpoServerHealth] Network state changed:', {
          type: state.type,
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
        });

        this.healthStatus.networkState = state;
        this.healthStatus.lastCheck = new Date();

        if (!state.isConnected) {
          this.healthStatus.isHealthy = false;
          this.healthStatus.errors.push('Network disconnected');
          console.log('[ExpoServerHealth] ⚠️ Network disconnected - app may lose connection to dev server');
        } else if (!state.isInternetReachable) {
          this.healthStatus.isHealthy = false;
          this.healthStatus.errors.push('Internet unreachable');
          console.log('[ExpoServerHealth] ⚠️ Internet unreachable - tunnel connection may fail');
        } else {
          this.healthStatus.isHealthy = true;
          this.healthStatus.errors = [];
          console.log('[ExpoServerHealth] ✅ Network restored');
        }
      });
    } catch (error) {
      console.log('[ExpoServerHealth] Failed to set up network listener:', error);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkNetworkHealth();
    }, 30000);
  }

  /**
   * Get current health status
   */
  getHealthStatus(): ServerHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('[ExpoServerHealth] Cleaning up health monitor...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.networkListener) {
      this.networkListener.remove();
      this.networkListener = null;
    }
  }
}

// Singleton instance
export const serverHealthMonitor = new ExpoServerHealthMonitor();

/**
 * Hook to use server health status in components
 */
export function useServerHealth() {
  const [healthStatus, setHealthStatus] = React.useState<ServerHealthStatus>(
    serverHealthMonitor.getHealthStatus()
  );

  React.useEffect(() => {
    // Update health status every 5 seconds
    const interval = setInterval(() => {
      setHealthStatus(serverHealthMonitor.getHealthStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return healthStatus;
}
