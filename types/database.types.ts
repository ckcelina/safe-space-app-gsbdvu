
export interface Message {
  id: string;
  user_id: string;
  person_id: string;
  sender?: 'user' | 'ai';
  role?: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship_type?: string;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  role: 'free' | 'premium' | 'admin';
  created_at: string;
}
