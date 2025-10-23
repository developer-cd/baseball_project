import { Server } from 'socket.io';
import FieldPosition from '../models/FieldPosition.js';

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Admin sets positions
      socket.on('admin:setPositions', async (data) => {
        try {
          const { scenario, positions, adminId } = data;
          
          console.log('Received admin:setPositions:', { scenario, adminId, positionsCount: Object.keys(positions).length });
          
          if (!adminId) {
            throw new Error('Admin ID is required for authentication');
          }
          
          // Deactivate previous positions for this scenario
          await FieldPosition.updateMany(
            { scenario, isActive: true },
            { isActive: false }
          );

          // Create new position record
          const fieldPosition = new FieldPosition({
            scenario,
            positions,
            createdBy: adminId,
            isActive: true
          });

          await fieldPosition.save();

          // Broadcast to all users
          this.io.emit('positions:updated', {
            scenario,
            positions,
            setBy: 'admin',
            timestamp: new Date()
          });

          socket.emit('admin:positionsSaved', { success: true, id: fieldPosition._id });
        } catch (error) {
          console.error('Error saving admin positions:', error);
          socket.emit('admin:positionsError', { error: error.message });
        }
      });

      // Admin updates positions
      socket.on('admin:updatePositions', async (data) => {
        try {
          const { scenario, positions, adminId } = data;
          
          const existingPosition = await FieldPosition.findOne({ scenario, isActive: true });
          
          if (existingPosition) {
            existingPosition.positions = positions;
            existingPosition.updatedAt = new Date();
            await existingPosition.save();
          } else {
            // Create new if doesn't exist
            const fieldPosition = new FieldPosition({
              scenario,
              positions,
              createdBy: adminId,
              isActive: true
            });
            await fieldPosition.save();
          }

          // Broadcast to all users
          this.io.emit('positions:updated', {
            scenario,
            positions,
            setBy: 'admin',
            timestamp: new Date()
          });

          socket.emit('admin:positionsUpdated', { success: true });
        } catch (error) {
          console.error('Error updating admin positions:', error);
          socket.emit('admin:positionsError', { error: error.message });
        }
      });

      // User requests current positions
      socket.on('user:getPositions', async (data) => {
        try {
          const { scenario } = data;
          console.log('User requesting positions for scenario:', scenario);
          
          const fieldPosition = await FieldPosition.findOne({ scenario, isActive: true });
          console.log('Found field position:', fieldPosition ? 'Yes' : 'No');
          
          if (fieldPosition) {
            console.log('Sending positions to user for scenario:', scenario);
            socket.emit('user:positionsReceived', {
              scenario,
              positions: fieldPosition.positions,
              setBy: 'admin',
              timestamp: fieldPosition.updatedAt
            });
          } else {
            console.log('No positions found for scenario:', scenario);
            socket.emit('user:positionsReceived', {
              scenario,
              positions: null,
              setBy: 'none',
              timestamp: null
            });
          }
        } catch (error) {
          console.error('Error getting positions:', error);
          socket.emit('user:positionsError', { error: error.message });
        }
      });

      // Admin clears positions
      socket.on('admin:clearPositions', async (data) => {
        try {
          const { scenario } = data;
          
          await FieldPosition.updateMany(
            { scenario, isActive: true },
            { isActive: false }
          );

          // Broadcast to all users
          this.io.emit('positions:cleared', {
            scenario,
            timestamp: new Date()
          });

          socket.emit('admin:positionsCleared', { success: true });
        } catch (error) {
          console.error('Error clearing positions:', error);
          socket.emit('admin:positionsError', { error: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    return this.io;
  }

  getIO() {
    return this.io;
  }
}

export default new SocketService();
