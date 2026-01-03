/**
 * Tests for AuthContext
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn((callback) => {
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('AuthContext', () => {
  it('should provide authentication state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toHaveProperty('currentUser');
    expect(result.current).toHaveProperty('userId');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('role');
    expect(result.current).toHaveProperty('isPremium');
  });

  it('should initially have loading state as true', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });
});
