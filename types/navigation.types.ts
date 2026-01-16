
/**
 * Navigation Types
 * 
 * Type definitions for navigation parameters and routes.
 */

/**
 * Chat screen navigation parameters
 */
export interface ChatScreenParams {
  personId: string;
  personName: string;
  initialSubject?: string;
}

/**
 * Library detail screen navigation parameters
 */
export interface LibraryDetailParams {
  topicId: string;
  topicName: string;
}

/**
 * Communication style preview navigation parameters
 */
export interface CommunicationStylePreviewParams {
  personaId: string;
}

/**
 * Memory screen navigation parameters
 */
export interface MemoryScreenParams {
  personId: string;
  personName: string;
}

