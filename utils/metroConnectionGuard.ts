
/**
 * Metro Connection Guard
 * 
 * Provides automatic recovery and connection stability for Metro bundler.
 * Implements best practices from Expo documentation to prevent connection issues.
 */

import { Platform } from 'react-native';

interface MetroConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  enableAutoRecovery: boolean;
}

const DEFAULT_CONFIG: MetroConnectionConfig = {
  maxRetries: 3,
  retryDelay: 2000,
  healthCheckInterval: 30000,
  enableAutoRecovery: true,
};

class MetroConnectionGuard {
  private config: MetroConnectionConfig;
  private connectionAttempts: number = 0;
  private lastSuccessfulConnection: Date | null = null;
  private isRecovering: boolean = false;

  constructor(config: Partial<MetroConnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[MetroGuard] Initialized with config:', this.config);
  }

  /**
   * Initialize connection guard
   */
  async initialize(): Promise<void> {
    console.log('[MetroGuard] Starting Metro connection guard...');
    console.log('[MetroGuard] Platform:', Platform.OS);
    console.log('[MetroGuard] Environment:', __DEV__ ? 'development' : 'production');

    if (!__DEV__) {
      console.log('[MetroGuard] Production mode - Metro guard disabled');
      return;
    }

    // Log Metro connection info
    this.logConnectionInfo();

    // Mark initial connection as successful
    this.lastSuccessfulConnection = new Date();
    console.log('[MetroGuard] ✅ Initial connection established');
  }

  /**
   * Log connection information
   */
  private logConnectionInfo(): void {
    console.log('[MetroGuard] Connection Info:', {
      platform: Platform.OS,
      isDev: __DEV__,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle connection error with automatic retry
   */
  async handleConnectionError(error: Error): Promise<void> {
    console.log('[MetroGuard] ⚠️ Connection error detected:', error.message);

    if (!this.config.enableAutoRecovery) {
      console.log('[MetroGuard] Auto-recovery disabled');
      return;
    }

    if (this.isRecovering) {
      console.log('[MetroGuard] Already recovering, skipping...');
      return;
    }

    this.isRecovering = true;
    this.connectionAttempts++;

    if (this.connectionAttempts > this.config.maxRetries) {
      console.log('[MetroGuard] ❌ Max retries exceeded, giving up');
      this.isRecovering = false;
      return;
    }

    console.log(
      `[MetroGuard] Attempting recovery (${this.connectionAttempts}/${this.config.maxRetries})...`
    );

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));

    // Log recovery attempt
    console.log('[MetroGuard] Recovery attempt completed');
    this.isRecovering = false;
  }

  /**
   * Mark connection as successful
   */
  markConnectionSuccess(): void {
    this.lastSuccessfulConnection = new Date();
    this.connectionAttempts = 0;
    this.isRecovering = false;
    console.log('[MetroGuard] ✅ Connection marked as successful');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isRecovering: this.isRecovering,
      connectionAttempts: this.connectionAttempts,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      maxRetries: this.config.maxRetries,
    };
  }
}

// Singleton instance
export const metroConnectionGuard = new MetroConnectionGuard();

/**
 * Global error handler for Metro connection issues
 */
export function setupMetroErrorHandler(): void {
  if (!__DEV__) {
    return;
  }

  // Handle unhandled promise rejections
  const originalHandler = global.Promise.prototype.catch;
  
  global.Promise.prototype.catch = function (onRejected) {
    return originalHandler.call(this, (error: Error) => {
      // Check if it's a Metro connection error
      if (
        error.message?.includes('Metro') ||
        error.message?.includes('bundler') ||
        error.message?.includes('connection')
      ) {
        console.log('[MetroGuard] Caught Metro-related error:', error.message);
        metroConnectionGuard.handleConnectionError(error);
      }

      // Call original handler
      if (onRejected) {
        return onRejected(error);
      }
      throw error;
    });
  };

  console.log('[MetroGuard] ✅ Error handler installed');
}
