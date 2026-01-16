
/**
 * Settings Types
 * 
 * Type definitions for the settings screen.
 */

export interface PersonalizationUpdate {
  id: string;
  user_id: string;
  title: string;
  details?: string;
  started_at?: string;
  ai_preference?: string;
  created_at: string;
  updated_at: string;
}

