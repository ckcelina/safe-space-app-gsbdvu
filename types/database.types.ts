
export interface Message {
  id: string;
  user_id: string;
  person_id?: string; // Optional for person-based chats
  topic_id?: string; // Optional for topic-based chats
  role: 'user' | 'assistant';
  content: string;
  subject?: string; // Added subject field for topic-based conversations
  type?: 'text' | 'image'; // NEW: Message type for image support
  image_url?: string; // NEW: Storage path for uploaded images
  caption?: string; // NEW: Optional caption for images
  created_at: string;
  is_system_message?: boolean; // NEW: Flag for system messages (not stored in DB, client-side only)
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship_type?: string;
  created_at: string;
}

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  role: 'free' | 'premium' | 'admin';
  ai_tone_id?: string;
  ai_science_mode?: boolean;
  created_at: string;
}

export interface TherapistMemoryNotes {
  id: string;
  user_id: string;
  therapist_id: string;
  recent_incidents: string[];
  recurring_patterns: string[];
  triggers: string[];
  helpful_strategies: string[];
  created_at: string;
  updated_at: string;
}
