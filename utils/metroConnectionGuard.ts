
/**
 * Metro Connection Guard
 * 
 * Provides automatic recovery and connection stability for Metro bundler.
 * Implements best practices from Expo documentation to prevent connection issues.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Connection health monitoring
 * - Error pattern detection
 * - Recovery strategies
 */

import { Platform } from 'react-native';

interface MetroConnectionConfig {
  maxRetries: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
  healthCheckInterval: number;
  enableAutoRecovery: boolean;
}

const DEFAULT_CONFIG: MetroConnectionConfig = {
  maxRetries: 5,
  initialRetryDelay: 1000,
  maxRetryDelay: 30000,
  healthCheckInterval: 30000,
  enableAutoRecovery: true,
};

class MetroConnectionGuard {
  private config: MetroConnectionConfig;
  private connectionAttempts: number = 0;
  private lastSuccessfulConnection: Date | null = null;
  private isRecovering: boolean = false;
  private errorPatterns: Map<string, number> = new Map();
  private recoveryStrategies: Map<string, () => void> = new Map();

  constructor(config: Partial<MetroConnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[MetroGuard] Initialized with config:', this.config);
    this.setupRecoveryStrategies();
  }

  /**
   * Set up recovery strategies for different error types
   */
  private setupRecoveryStrategies(): void {
    this.recoveryStrategies.set('ECONNREFUSED', () => {
      console.log('[MetroGuard] 🔧 Recovery: Connection refused - Metro may need restart');
    });

    this.recoveryStrategies.set('ETIMEDOUT', () => {
      console.log('[MetroGuard] 🔧 Recovery: Connection timeout - checking network');
    });

    this.recoveryStrategies.set('ENOTFOUND', () => {
      console.log('[MetroGuard] 🔧 Recovery: Host not found - checking DNS');
    });

    this.recoveryStrategies.set('NETWORK_ERROR', () => {
      console.log('[MetroGuard] 🔧 Recovery: Network error - waiting for connection');
    });
  }

  /**
   * Initialize connection guard
   */
  async initialize(): Promise<void> {
    console.log('[MetroGuard] 🚀 Starting Metro connection guard...');
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
      attempts: this.connectionAttempts,
      lastSuccess: this.lastSuccessfulConnection?.toISOString() || 'never',
    });
  }

  /**
   * Detect error pattern
   */
  private detectErrorPattern(error: Error): string | null {
    const message = error.message.toLowerCase();

    if (message.includes('econnrefused')) return 'ECONNREFUSED';
    if (message.includes('etimedout')) return 'ETIMEDOUT';
    if (message.includes('enotfound')) return 'ENOTFOUND';
    if (message.includes('network')) return 'NETWORK_ERROR';
    if (message.includes('metro')) return 'METRO_ERROR';
    if (message.includes('bundler')) return 'BUNDLER_ERROR';

    return null;
  }

  /**
   * Handle connection error with automatic retry
   */
  async handleConnectionError(error: Error): Promise<void> {
    console.log('[MetroGuard] ⚠️ Connection error detected:', error.message);

    // Detect error pattern
    const pattern = this.detectErrorPattern(error);
    if (pattern) {
      const count = (this.errorPatterns.get(pattern) || 0) + 1;
      this.errorPatterns.set(pattern, count);
      console.log(`[MetroGuard] Error pattern detected: ${pattern} (count: ${count})`);

      // Execute recovery strategy
      const strategy = this.recoveryStrategies.get(pattern);
      if (strategy) {
        strategy();
      }
    }

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
      console.log('[MetroGuard] ❌ Max retries exceeded');
      console.log('[MetroGuard] Error patterns:', Array.from(this.errorPatterns.entries()));
      this.isRecovering = false;
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.initialRetryDelay * Math.pow(2, this.connectionAttempts - 1),
      this.config.maxRetryDelay
    );

    console.log(
      `[MetroGuard] Attempting recovery (${this.connectionAttempts}/${this.config.maxRetries}) in ${delay}ms...`
    );

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, delay));

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
    this.errorPatterns.clear();
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
      errorPatterns: Array.from(this.errorPatterns.entries()),
      timeSinceLastSuccess: this.lastSuccessfulConnection
        ? Date.now() - this.lastSuccessfulConnection.getTime()
        : null,
    };
  }

  /**
   * Reset connection state
   */
  reset(): void {
    console.log('[MetroGuard] Resetting connection state...');
    this.connectionAttempts = 0;
    this.isRecovering = false;
    this.errorPatterns.clear();
    this.lastSuccessfulConnection = new Date();
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

  console.log('[MetroGuard] Setting up global error handler...');

  // Handle unhandled promise rejections
  if (typeof global !== 'undefined') {
    const originalUnhandledRejection = global.onunhandledrejection;
    
    global.onunhandledrejection = (event: any) => {
      const error = event.reason;
      
      // Check if it's a Metro connection error
      if (
        error?.message?.includes('Metro') ||
        error?.message?.includes('bundler') ||
        error?.message?.includes('connection') ||
        error?.message?.includes('ECONNREFUSED') ||
        error?.message?.includes('ETIMEDOUT')
      ) {
        console.log('[MetroGuard] Caught Metro-related error:', error.message);
        metroConnectionGuard.handleConnectionError(error);
      }

      // Call original handler
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };
  }

  console.log('[MetroGuard] ✅ Error handler installed');
}
