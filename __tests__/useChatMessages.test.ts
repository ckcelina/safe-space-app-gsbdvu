/**
 * Tests for useChatMessages hook
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { useChatMessages } from '../hooks/useChatMessages';
import { supabase } from '../lib/supabase';

// Mock the supabase client
jest.mock('../lib/supabase');

describe('useChatMessages', () => {
  const mockPersonId = 'person-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty messages and loading state', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        personId: mockPersonId,
        userId: mockUserId,
      })
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should load messages successfully', async () => {
    const mockMessages = [
      {
        id: '1',
        user_id: mockUserId,
        person_id: mockPersonId,
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: mockUserId,
        person_id: mockPersonId,
        role: 'assistant',
        content: 'Hi there!',
        created_at: '2024-01-01T00:01:00Z',
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
    });

    const { result } = renderHook(() =>
      useChatMessages({
        personId: mockPersonId,
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors when loading messages', async () => {
    const mockError = { message: 'Failed to fetch' };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null, error: mockError }),
    });

    const { result } = renderHook(() =>
      useChatMessages({
        personId: mockPersonId,
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load messages');
    expect(result.current.messages).toEqual([]);
  });

  it('should handle missing personId', async () => {
    const { result } = renderHook(() =>
      useChatMessages({
        personId: '',
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Invalid person ID');
  });

  it('should merge messages without duplicates', () => {
    const { result } = renderHook(() =>
      useChatMessages({
        personId: mockPersonId,
        userId: mockUserId,
      })
    );

    const existingMessages = [
      {
        id: '1',
        user_id: mockUserId,
        person_id: mockPersonId,
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const newMessages = [
      {
        id: '1', // Duplicate ID
        user_id: mockUserId,
        person_id: mockPersonId,
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2', // New message
        user_id: mockUserId,
        person_id: mockPersonId,
        role: 'assistant',
        content: 'Hi!',
        created_at: '2024-01-01T00:01:00Z',
      },
    ];

    const merged = result.current.mergeMessages(existingMessages, newMessages);

    expect(merged.length).toBe(2); // Should only have 2 unique messages
    expect(merged[0].id).toBe('1');
    expect(merged[1].id).toBe('2');
  });
});
