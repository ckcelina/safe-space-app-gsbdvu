/**
 * Network Status Monitor
 *
 * Monitors network connectivity status.
 */

import NetInfo from '@react-native-community/netinfo';

/**
 * Check if the device is currently online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch (error) {
    console.error('[NetworkStatus] Failed to check network status:', error);
    // Assume online if check fails
    return true;
  }
}

/**
 * Subscribe to network status changes
 */
export function subscribeToNetworkChanges(callback: (isConnected: boolean) => void) {
  return NetInfo.addEventListener((state) => {
    const connected = state.isConnected === true && state.isInternetReachable !== false;
    callback(connected);
  });
}
