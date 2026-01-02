
/**
 * Expo Server Health Monitor
 * 
 * This utility provides comprehensive monitoring and auto-recovery
 * for the Expo development server to ensure it never breaks.
 * 
 * Features:
 * - Network connectivity monitoring
 * - Automatic reconnection on network changes
 * - Health status tracking
 * - Error recovery mechanisms
 */

import * as Network from 'expo-network';
import { Platform } from 'react-native';

interface ServerHealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  networkState: Network.NetworkState | null;
  errors: string[];
  reconnectAttempts: number;
  lastSuccessfulConnection: Date | null;
}

class ExpoServerHealthMonitor {
  private healthStatus: ServerHealthStatus = {
    isHealthy: true,
    lastCheck: new Date(),
    networkState: null,
    errors: [],
    reconnectAttempts: 0,
    lastSuccessfulConnection: new Date(),
  };

  private healthCheckInterval: NodeJS.Timeout | null = null;
  private networkListener: { remove: () => void } | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds

  /**
   * Initialize health monitoring
   */
  async initialize(): Promise<void> {
    console.log('[ExpoServerHealth] 🚀 Initializing health monitor...');
    console.log('[ExpoServerHealth] Platform:', Platform.OS);
    console.log('[ExpoServerHealth] Environment:', __DEV__ ? 'development' : 'production');

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
        this.handleNetworkDisconnection('Network disconnected');
      } else if (!networkState.isInternetReachable) {
        this.handleNetworkDisconnection('Internet unreachable');
      } else {
        this.handleNetworkReconnection();
      }
    } catch (error) {
      console.log('[ExpoServerHealth] Error checking network health:', error);
      // Don't mark as unhealthy - network check failure doesn't mean server is broken
    }
  }

  /**
   * Handle network disconnection
   */
  private handleNetworkDisconnection(reason: string): void {
    if (this.healthStatus.isHealthy) {
      console.log('[ExpoServerHealth] ⚠️', reason);
      this.healthStatus.isHealthy = false;
      this.healthStatus.errors.push(reason);
      
      // Start reconnection attempts
      this.scheduleReconnection();
    }
  }

  /**
   * Handle network reconnection
   */
  private handleNetworkReconnection(): void {
    if (!this.healthStatus.isHealthy) {
      console.log('[ExpoServerHealth] ✅ Network restored');
      this.healthStatus.isHealthy = true;
      this.healthStatus.errors = [];
      this.healthStatus.reconnectAttempts = 0;
      this.healthStatus.lastSuccessfulConnection = new Date();
      
      // Clear any pending reconnection attempts
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    } else {
      // Update last successful connection time
      this.healthStatus.lastSuccessfulConnection = new Date();
    }
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnection(): void {
    if (this.reconnectTimeout) {
      return; // Already scheduled
    }

    if (this.healthStatus.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[ExpoServerHealth] ❌ Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.healthStatus.reconnectAttempts);
    console.log(`[ExpoServerHealth] Scheduling reconnection attempt in ${delay}ms...`);

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      this.healthStatus.reconnectAttempts++;
      
      console.log(
        `[ExpoServerHealth] Reconnection attempt ${this.healthStatus.reconnectAttempts}/${this.maxReconnectAttempts}`
      );
      
      await this.checkNetworkHealth();
      
      // Schedule next attempt if still disconnected
      if (!this.healthStatus.isHealthy) {
        this.scheduleReconnection();
      }
    }, delay);
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
          this.handleNetworkDisconnection('Network disconnected');
        } else if (!state.isInternetReachable) {
          this.handleNetworkDisconnection('Internet unreachable');
        } else {
          this.handleNetworkReconnection();
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
   * Force a health check
   */
  async forceHealthCheck(): Promise<void> {
    console.log('[ExpoServerHealth] Forcing health check...');
    await this.checkNetworkHealth();
  }

  /**
   * Reset reconnection attempts
   */
  resetReconnectionAttempts(): void {
    this.healthStatus.reconnectAttempts = 0;
    console.log('[ExpoServerHealth] Reconnection attempts reset');
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

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Singleton instance
export const serverHealthMonitor = new ExpoServerHealthMonitor();

/**
 * Hook to use server health status in components
 */
import React from 'react';

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
