import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [adminPositions, setAdminPositions] = useState({});
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:5000', {
        auth: {
          userId: user._id || user.id,
          role: user.role
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Listen for position updates from admin
      newSocket.on('positions:updated', (data) => {
        setAdminPositions(prev => ({
          ...prev,
          [data.scenario]: {
            positions: data.positions,
            setBy: data.setBy,
            timestamp: data.timestamp
          }
        }));
      });

      // Listen for positions cleared by admin
      newSocket.on('positions:cleared', (data) => {
        setAdminPositions(prev => {
          const updated = { ...prev };
          delete updated[data.scenario];
          return updated;
        });
      });

      // Listen for admin position save confirmation
      newSocket.on('admin:positionsSaved', (data) => {
        // Admin positions saved successfully
      });

      // Listen for admin position update confirmation
      newSocket.on('admin:positionsUpdated', (data) => {
        // Admin positions updated successfully
      });

      // Listen for admin position clear confirmation
      newSocket.on('admin:positionsCleared', (data) => {
        // Admin positions cleared successfully
      });

      // Listen for user position responses
      newSocket.on('user:positionsReceived', (data) => {
        if (data.positions) {
          setAdminPositions(prev => ({
            ...prev,
            [data.scenario]: {
              positions: data.positions,
              setBy: data.setBy,
              timestamp: data.timestamp
            }
          }));
        }
      });

      // Listen for errors
      newSocket.on('admin:positionsError', (error) => {
        console.error('Admin positions error:', error);
      });

      newSocket.on('user:positionsError', (error) => {
        console.error('User positions error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  // Admin functions
  const saveAdminPositions = (scenario, positions) => {
    if (socket && user?.role === 'admin') {
      const adminId = user._id || user.id || user.userId || user.user_id;
      
      if (adminId) {
        socket.emit('admin:setPositions', {
          scenario,
          positions,
          adminId: adminId
        });
      } else {
        alert('Error: User ID not found. Please check your login status.');
      }
    } else {
      alert('Error: Admin authentication required. Please login as admin.');
    }
  };

  const updateAdminPositions = (scenario, positions) => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:updatePositions', {
        scenario,
        positions,
        adminId: user.id
      });
    }
  };

  const clearAdminPositions = (scenario) => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:clearPositions', { scenario });
    }
  };

  // User functions
  const requestUserPositions = (scenario) => {
    if (socket) {
      socket.emit('user:getPositions', { scenario });
    }
  };

  const getAdminPositions = (scenario) => {
    return adminPositions[scenario] || null;
  };

  const hasAdminPositions = (scenario) => {
    return adminPositions[scenario] && adminPositions[scenario].positions;
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      adminPositions,
      saveAdminPositions,
      updateAdminPositions,
      clearAdminPositions,
      requestUserPositions,
      getAdminPositions,
      hasAdminPositions
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
