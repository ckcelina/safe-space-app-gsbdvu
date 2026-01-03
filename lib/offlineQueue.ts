/**
 * Offline Message Queue
 *
 * Queues messages when the user is offline and sends them when online.
 * Uses AsyncStorage for persistence across app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@safe_space_message_queue';

export interface QueuedMessage {
  id: string;
  personId: string;
  userId: string;
  content: string;
  subject: string;
  timestamp: string;
  retryCount: number;
}

/**
 * Add a message to the offline queue
 */
export async function queueMessage(message: Omit<QueuedMessage, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  try {
    const queue = await getQueue();
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    queue.push(queuedMessage);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('[OfflineQueue] Message queued:', queuedMessage.id);
  } catch (error) {
    console.error('[OfflineQueue] Failed to queue message:', error);
    throw error;
  }
}

/**
 * Get all queued messages
 */
export async function getQueue(): Promise<QueuedMessage[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    if (!data) return [];

    const queue = JSON.parse(data);
    return Array.isArray(queue) ? queue : [];
  } catch (error) {
    console.error('[OfflineQueue] Failed to get queue:', error);
    return [];
  }
}

/**
 * Remove a message from the queue by ID
 */
export async function removeFromQueue(messageId: string): Promise<void> {
  try {
    const queue = await getQueue();
    const filtered = queue.filter((msg) => msg.id !== messageId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    console.log('[OfflineQueue] Message removed from queue:', messageId);
  } catch (error) {
    console.error('[OfflineQueue] Failed to remove message from queue:', error);
    throw error;
  }
}

/**
 * Clear the entire queue
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('[OfflineQueue] Queue cleared');
  } catch (error) {
    console.error('[OfflineQueue] Failed to clear queue:', error);
    throw error;
  }
}

/**
 * Increment retry count for a message
 */
export async function incrementRetryCount(messageId: string): Promise<void> {
  try {
    const queue = await getQueue();
    const updated = queue.map((msg) => {
      if (msg.id === messageId) {
        return { ...msg, retryCount: msg.retryCount + 1 };
      }
      return msg;
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[OfflineQueue] Failed to increment retry count:', error);
    throw error;
  }
}

/**
 * Get queue size
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Check if queue is empty
 */
export async function isQueueEmpty(): Promise<boolean> {
  const size = await getQueueSize();
  return size === 0;
}
