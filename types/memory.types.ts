
/**
 * Memory Types
 * 
 * Type definitions for memory-related functionality.
 */

/**
 * Memory entry from database
 */
export interface Memory {
  id: string;
  user_id: string;
  person_id: string;
  category: string;
  key: string;
  value: string;
  importance: number;
  confidence: number;
  last_mentioned_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Grouped memories by category
 */
export interface GroupedMemories {
  [category: string]: Memory[];
}

/**
 * Memory edit form data
 */
export interface MemoryEditData {
  category: string;
  key: string;
  value: string;
  importance?: number;
}

