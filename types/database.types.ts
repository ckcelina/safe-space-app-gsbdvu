
export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship_type: string | null;
  created_at?: string;
}

export interface Message {
  id: string;
  user_id: string;
  person_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export type ThemeType = 'ocean-blue' | 'soft-rose' | 'forest-green';
