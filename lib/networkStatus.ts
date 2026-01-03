
/**
 * Network Status Monitor
 *
 * Monitors network connectivity status using expo-network.
 */

import * as Network from 'expo-network';

/**
 * Check if the device is currently online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected === true && networkState.isInternetReachable !== false;
  } catch (error) {
    console.error('[NetworkStatus] Failed to check network status:', error);
    // Assume online if check fails
    return true;
  }
}

/**
 * Subscribe to network status changes
 * Note: expo-network doesn't have a built-in listener, so this is a polling-based approach
 */
export function subscribeToNetworkChanges(callback: (isConnected: boolean) => void) {
  let lastState: boolean | null = null;
  
  const checkNetwork = async () => {
    try {
      const connected = await isOnline();
      if (connected !== lastState) {
        lastState = connected;
        callback(connected);
      }
    } catch (error) {
      console.error('[NetworkStatus] Error checking network:', error);
    }
  };

  // Check immediately
  checkNetwork();

  // Poll every 5 seconds
  const interval = setInterval(checkNetwork, 5000);

  // Return unsubscribe function
  return () => {
    clearInterval(interval);
  };
}
