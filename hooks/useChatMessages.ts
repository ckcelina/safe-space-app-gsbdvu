/**
 * useChatMessages Hook
 *
 * Manages chat message state, loading, and error handling.
 * Extracted from chat.tsx for better code organization and reusability.
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getPersonaById, DEFAULT_PERSONA_ID } from '@/constants/TherapistPersonas';

// Extended Message type with therapist metadata and client-side status
export interface ExtendedMessage {
  id: string;
  user_id: string;
  person_id: string;
  role: 'user' | 'assistant';
  content: string;
  subject?: string | null;
  created_at: string;
  therapist_name?: string;
  therapist_avatar_source?: any;
  failed_to_send?: boolean;
  retry_content?: string;
  optimistic?: boolean;
  temp_id?: string;
}

interface UseChatMessagesOptions {
  personId: string;
  userId: string;
  therapistPersonaId?: string;
}

export function useChatMessages({ personId, userId, therapistPersonaId }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Get therapist metadata for avatar and name
  const getTherapistMetadata = useCallback(() => {
    const personaId = therapistPersonaId || DEFAULT_PERSONA_ID;
    const persona = getPersonaById(personaId);

    if (!persona) {
      return {
        name: 'Safe Space',
        avatarSource: undefined,
        personaId: DEFAULT_PERSONA_ID,
      };
    }

    return {
      name: persona.name,
      avatarSource: persona.image,
      personaId: persona.id,
    };
  }, [therapistPersonaId]);

  const loadMessages = useCallback(async () => {
    if (!personId) {
      console.warn('[useChatMessages] loadMessages: personId is missing');
      if (isMountedRef.current) {
        setLoading(false);
        setError('Invalid person ID');
      }
      return;
    }

    if (!userId) {
      console.warn('[useChatMessages] loadMessages: No user ID available');
      if (isMountedRef.current) {
        setLoading(false);
        setError('You must be logged in to view messages');
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[useChatMessages] Loading messages for person:', personId, 'user:', userId);

      // OPTIMIZATION: Load only the last 100 messages for better performance
      // Messages are fetched in descending order then reversed for display
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('person_id', personId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        if (__DEV__) {
          console.log('[useChatMessages] loadMessages error', fetchError);
        }
        if (isMountedRef.current) {
          setError('Failed to load messages');
        }
        return;
      }

      console.log('[useChatMessages] Messages loaded:', data?.length || 0);

      // Reverse messages to show oldest first (since we fetched in DESC order)
      const reversedData = data ? [...data].reverse() : [];

      const therapistMeta = getTherapistMetadata();
      const messagesWithMetadata: ExtendedMessage[] = reversedData.map((msg) => {
        if (msg.role === 'assistant') {
          return {
            ...msg,
            therapist_name: therapistMeta.name,
            therapist_avatar_source: therapistMeta.avatarSource,
          };
        }
        return msg;
      });

      if (isMountedRef.current) {
        setMessages(messagesWithMetadata);
      }
    } catch (err: any) {
      if (__DEV__) {
        console.log('[useChatMessages] loadMessages unexpected error:', err);
      }
      if (isMountedRef.current) {
        setError('An unexpected error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [personId, userId, getTherapistMetadata]);

  // Helper to merge messages with deduplication
  const mergeMessages = useCallback((existing: ExtendedMessage[], incoming: ExtendedMessage[]): ExtendedMessage[] => {
    const merged = [...existing];

    for (const newMsg of incoming) {
      const existsById = merged.some(m => m.id === newMsg.id);
      if (existsById) {
        continue;
      }

      if (newMsg.temp_id) {
        const existsByTempId = merged.some(m => m.temp_id === newMsg.temp_id);
        if (existsByTempId) {
          continue;
        }
      }

      const newTime = new Date(newMsg.created_at).getTime();
      const isDuplicate = merged.some(m => {
        if (m.role !== newMsg.role) return false;
        if (m.subject !== newMsg.subject) return false;
        if (m.content !== newMsg.content) return false;

        const existingTime = new Date(m.created_at).getTime();
        const timeDiff = Math.abs(newTime - existingTime);
        return timeDiff < 5000;
      });

      if (!isDuplicate) {
        merged.push(newMsg);
      }
    }

    return merged.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return timeA - timeB;
    });
  }, []);

  return {
    messages,
    setMessages,
    loading,
    error,
    setError,
    loadMessages,
    mergeMessages,
    getTherapistMetadata,
    isMountedRef,
  };
}
