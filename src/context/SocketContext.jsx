import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [adminPositions, setAdminPositions] = useState({});
  const [adminGuidelines, setAdminGuidelines] = useState({});
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

      // Guidelines listeners
      newSocket.on('guidelines:updated', (data) => {
        setAdminGuidelines(prev => ({
          ...prev,
          [data.scenario]: {
            shapes: data.shapes,
            setBy: data.setBy,
            timestamp: data.timestamp
          }
        }));
      });

      newSocket.on('guidelines:cleared', (data) => {
        setAdminGuidelines(prev => {
          const updated = { ...prev };
          delete updated[data.scenario];
          return updated;
        });
      });

      newSocket.on('user:guidelinesReceived', (data) => {
        setAdminGuidelines(prev => ({
          ...prev,
          [data.scenario]: {
            shapes: data.shapes || [],
            setBy: data.setBy,
            timestamp: data.timestamp
          }
        }));
      });

      newSocket.on('admin:guidelinesError', (error) => {
        console.error('Admin guidelines error:', error);
      });

      newSocket.on('user:guidelinesError', (error) => {
        console.error('User guidelines error:', error);
      });

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

  // Guidelines admin functions
  const saveAdminGuidelines = (scenario, shapes) => {
    if (socket && user?.role === 'admin') {
      const adminId = user._id || user.id || user.userId || user.user_id;
      socket.emit('admin:setGuidelines', { scenario, shapes, adminId });
    }
  };

  const updateAdminGuidelines = (scenario, shapes) => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:updateGuidelines', { scenario, shapes, adminId: user.id });
    }
  };

  const clearAdminGuidelines = (scenario) => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:clearGuidelines', { scenario });
    }
  };

  // User functions
  const requestUserPositions = (scenario) => {
    if (socket) {
      socket.emit('user:getPositions', { scenario });
    }
  };

  const requestUserGuidelines = (scenario) => {
    if (socket) {
      socket.emit('user:getGuidelines', { scenario });
    }
  };

  const getAdminPositions = (scenario) => {
    return adminPositions[scenario] || null;
  };

  const hasAdminPositions = (scenario) => {
    return adminPositions[scenario] && adminPositions[scenario].positions;
  };

  const getGuidelines = (scenario) => adminGuidelines[scenario] || null;
  const hasGuidelines = (scenario) => !!(adminGuidelines[scenario] && adminGuidelines[scenario].shapes && adminGuidelines[scenario].shapes.length > 0);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      adminPositions,
      adminGuidelines,
      saveAdminPositions,
      updateAdminPositions,
      clearAdminPositions,
      saveAdminGuidelines,
      updateAdminGuidelines,
      clearAdminGuidelines,
      requestUserPositions,
      requestUserGuidelines,
      getAdminPositions,
      hasAdminPositions,
      getGuidelines,
      hasGuidelines
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
