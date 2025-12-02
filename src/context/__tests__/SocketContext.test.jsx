import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import { SocketProvider, useSocket } from '../SocketContext';
import { io } from 'socket.io-client';
import { useAuth } from '../AuthContext';

jest.mock('socket.io-client', () => ({
  io: jest.fn()
}));

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('SocketContext', () => {
  const mockUseAuth = useAuth;

  const createSocketStub = () => {
    const handlers = {};
    return {
      emit: jest.fn(),
      on: jest.fn((event, handler) => {
        handlers[event] = handler;
      }),
      close: jest.fn(),
      handlers
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
  });

  test('useSocket throws when accessed outside provider', () => {
    const renderHook = () => {
      const TestComponent = () => {
        useSocket();
        return null;
      };
      render(<TestComponent />);
    };

    expect(renderHook).toThrow('useSocket must be used within a SocketProvider');
  });

  test('does not initialise socket when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });

    const TestConsumer = () => {
      const context = useSocket();
      expect(context.socket).toBeNull();
      expect(context.isConnected).toBe(false);
      return null;
    };

    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    expect(io).not.toHaveBeenCalled();
  });

  test('connects to socket server and handles admin updates', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'admin-1', role: 'admin' }
    });

    const socketStub = createSocketStub();
    io.mockReturnValue(socketStub);

    let contextValue;
    const TestConsumer = () => {
      contextValue = useSocket();
      return null;
    };

    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    await waitFor(() => expect(io).toHaveBeenCalledWith('http://localhost:5000', {
      auth: { userId: 'admin-1', role: 'admin' }
    }));

    expect(contextValue.socket).toBe(socketStub);

    act(() => {
      socketStub.handlers['connect']?.();
    });
    expect(contextValue.isConnected).toBe(true);

    act(() => {
      socketStub.handlers['positions:updated']?.({
        scenario: 'Fly ball to LF',
        positions: { P: { x: 50, y: 40 } },
        setBy: 'admin-1',
        timestamp: 123
      });
    });

    await waitFor(() => expect(contextValue.hasAdminPositions('Fly ball to LF')).toBeTruthy());
    expect(contextValue.getAdminPositions('Fly ball to LF').positions).toEqual({ P: { x: 50, y: 40 } });

    act(() => {
      socketStub.handlers['guidelines:updated']?.({
        scenario: 'Fly ball to LF',
        shapes: [{ id: 'g1', points: [0, 0, 10, 10] }],
        setBy: 'admin-1',
        timestamp: 456
      });
    });

    await waitFor(() => expect(contextValue.getGuidelines('Fly ball to LF').shapes).toHaveLength(1));

    act(() => {
      contextValue.saveAdminPositions('Fly ball to LF', { P: { x: 60, y: 50 } });
    });
    expect(socketStub.emit).toHaveBeenCalledWith('admin:setPositions', {
      scenario: 'Fly ball to LF',
      positions: { P: { x: 60, y: 50 } },
      adminId: 'admin-1'
    });

    act(() => {
      contextValue.requestUserGuidelines('Fly ball to LF');
    });
    expect(socketStub.emit).toHaveBeenCalledWith('user:getGuidelines', { scenario: 'Fly ball to LF' });
  });

  test('alerts when non-admin user attempts admin-only actions', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'coach-1', role: 'coach' }
    });

    const socketStub = createSocketStub();
    io.mockReturnValue(socketStub);

    let contextValue;
    const TestConsumer = () => {
      contextValue = useSocket();
      return null;
    };

    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    await waitFor(() => expect(io).toHaveBeenCalled());

    act(() => {
      contextValue.saveAdminPositions('Scenario', {});
    });

    expect(window.alert).toHaveBeenCalledWith('Error: Admin authentication required. Please login as admin.');
    expect(socketStub.emit).not.toHaveBeenCalled();
  });
});
