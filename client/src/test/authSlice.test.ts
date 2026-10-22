import { describe, it, expect, beforeEach } from 'vitest';
import authReducer, { setCredentials, logout, setUser } from '../features/auth/authSlice';
import { User } from '../types';

describe('authSlice Reducer', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Alex Rivera',
    email: 'alex@attendly.local',
    role: 'employee',
    employeeCode: 'EMP-003',
    department: 'Engineering',
    isActive: true,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('should handle setCredentials', () => {
    const previousState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    };

    const nextState = authReducer(
      previousState,
      setCredentials({ user: mockUser, token: 'mock-jwt-token-xyz' })
    );

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user?.name).toBe('Alex Rivera');
    expect(nextState.token).toBe('mock-jwt-token-xyz');
    expect(localStorage.getItem('attendly_token')).toBe('mock-jwt-token-xyz');
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: mockUser,
      token: 'mock-jwt-token-xyz',
      isAuthenticated: true,
      isLoading: false,
    };

    const nextState = authReducer(loggedInState, logout());
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
    expect(localStorage.getItem('attendly_token')).toBeNull();
  });

  it('should handle setUser', () => {
    const initialState = {
      user: null,
      token: 'existing-token',
      isAuthenticated: true,
      isLoading: true,
    };

    const nextState = authReducer(initialState, setUser(mockUser));
    expect(nextState.user?.email).toBe('alex@attendly.local');
    expect(nextState.isLoading).toBe(false);
  });
});
