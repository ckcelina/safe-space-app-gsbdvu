
/**
 * Chat Types
 * 
 * Type definitions for chat-related functionality.
 */

import { Message } from './database.types';

/**
 * Extended message type with UI-specific fields
 */
export interface ExtendedMessage extends Message {
  therapist_name?: string;
  therapist_avatar_source?: any;
  failed_to_send?: boolean;
  retry_content?: string;
  optimistic?: boolean;
  temp_id?: string;
  is_system_message?: boolean;
}

/**
 * Message list item (can be a message or date separator)
 */
export type MessageListItem = 
  | ExtendedMessage
  | { type: 'date_separator'; label: string; id: string };

/**
 * Subject pill props
 */
export interface SubjectPillProps {
  subject: string;
  isSelected: boolean;
  onPress: (subject: string) => void;
  isAddButton?: boolean;
}

/**
 * Chat message for AI API
 */
export interface ChatMessageForAI {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/**
 * AI response result
 */
export interface AIResponseResult {
  reply: string;
  success?: boolean;
  error?: string;
}

