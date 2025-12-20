
export interface Message {
  id: string;
  user_id: string;
  person_id?: string; // Optional for person-based chats
  topic_id?: string; // Optional for topic-based chats
  role: 'user' | 'assistant';
  content: string;
  subject?: string; // Added subject field for topic-based conversations
  created_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship_type?: string;
  context_label?: string; // Optional context label (e.g., "Work", "Family")
  created_at: string;
}

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  context_label?: string; // Optional context label (e.g., "Work", "Family")
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}
