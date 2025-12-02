import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import React from 'react';

describe('AuthContext', () => {
  let contextValue;

  const TestConsumer = () => {
    contextValue = useAuth();
    return null;
  };

  beforeEach(() => {
    localStorage.clear();
    contextValue = undefined;
  });

  test('initialises with unauthenticated state when no tokens are stored', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(contextValue).toBeDefined());
    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.isAuthenticated).toBe(false);
    expect(contextValue.user).toBeNull();
  });

  test('restores user session from localStorage on mount', async () => {
    const storedUser = { id: 'user-1', role: 'coach', username: 'Coach Carter' };
    localStorage.setItem('accessToken', 'access-token');
    localStorage.setItem('refreshToken', 'refresh-token');
    localStorage.setItem('user', JSON.stringify(storedUser));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.user).toEqual(storedUser);
  });

  test('login stores credentials and returns role-specific dashboard route', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    const adminUser = { id: 'admin-1', role: 'admin', username: 'Admin User' };
    let returnedRoute;

    await act(async () => {
      returnedRoute = contextValue.login(adminUser, 'token-123', 'refresh-123');
    });

    expect(returnedRoute).toBe('/admin');
    expect(localStorage.getItem('accessToken')).toBe('token-123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-123');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(adminUser);
    expect(contextValue.user).toEqual(adminUser);
    expect(contextValue.isAuthenticated).toBe(true);

    expect(contextValue.getDashboardRoute({ role: 'coach' })).toBe('/coach');
    expect(contextValue.getDashboardRoute({ role: 'user' })).toBe('/home');
    expect(contextValue.getDashboardRoute({ role: 'unknown' })).toBe('/home');
  });

  test('logout clears stored credentials and resets auth state', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      contextValue.login({ id: 'coach-1', role: 'coach' }, 'token', 'refresh');
    });

    expect(contextValue.isAuthenticated).toBe(true);

    await act(async () => {
      contextValue.logout();
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(contextValue.isAuthenticated).toBe(false);
    expect(contextValue.user).toBeNull();
  });

  test('role helper utilities respond according to current user role', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      contextValue.login({ id: 'coach-12', role: 'CoAcH' }, 'token', 'refresh');
    });

    expect(contextValue.getUserRole()).toBe('CoAcH');
    expect(contextValue.isAdmin()).toBe(false);
    expect(contextValue.isCoach()).toBe(true);
    expect(contextValue.isUser()).toBe(false);
    expect(contextValue.hasRole('coach')).toBe(true);
    expect(contextValue.hasRole('admin')).toBe(false);
  });
});
