/**
 * Tests for message merging logic
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  subject?: string | null;
  created_at: string;
  temp_id?: string;
}

function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const merged = [...existing];

  for (const newMsg of incoming) {
    const existsById = merged.some((m) => m.id === newMsg.id);
    if (existsById) {
      continue;
    }

    if (newMsg.temp_id) {
      const existsByTempId = merged.some((m) => m.temp_id === newMsg.temp_id);
      if (existsByTempId) {
        continue;
      }
    }

    const newTime = new Date(newMsg.created_at).getTime();
    const isDuplicate = merged.some((m) => {
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
}

describe('mergeMessages', () => {
  it('should merge new messages with existing ones', () => {
    const existing: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const incoming: Message[] = [
      {
        id: '2',
        role: 'assistant',
        content: 'Hi!',
        created_at: '2024-01-01T00:01:00Z',
      },
    ];

    const result = mergeMessages(existing, incoming);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('should not duplicate messages with same ID', () => {
    const existing: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const incoming: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const result = mergeMessages(existing, incoming);

    expect(result).toHaveLength(1);
  });

  it('should not duplicate messages with same temp_id', () => {
    const existing: Message[] = [
      {
        id: 'temp-1',
        temp_id: 'temp-1',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const incoming: Message[] = [
      {
        id: 'temp-1',
        temp_id: 'temp-1',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const result = mergeMessages(existing, incoming);

    expect(result).toHaveLength(1);
  });

  it('should detect duplicates based on content and time proximity', () => {
    const existing: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const incoming: Message[] = [
      {
        id: '2',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:02Z', // Within 5 second window
      },
    ];

    const result = mergeMessages(existing, incoming);

    expect(result).toHaveLength(1); // Should be treated as duplicate
  });

  it('should sort messages by created_at timestamp', () => {
    const existing: Message[] = [
      {
        id: '2',
        role: 'assistant',
        content: 'Later message',
        created_at: '2024-01-01T00:02:00Z',
      },
    ];

    const incoming: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Earlier message',
        created_at: '2024-01-01T00:01:00Z',
      },
    ];

    const result = mergeMessages(existing, incoming);

    expect(result[0].id).toBe('1'); // Earlier message first
    expect(result[1].id).toBe('2');
  });
});
