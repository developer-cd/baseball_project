import { Server } from 'socket.io';
import FieldPosition from '../models/FieldPosition.js';
import Guideline from '../models/Guideline.js';

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

      // ===== GUIDELINES =====
      socket.on('admin:setGuidelines', async (data) => {
        try {
          const { scenario, shapes, adminId } = data;
          console.log('[guidelines] admin:setGuidelines', {
            scenario,
            adminId,
            shapesCount: Array.isArray(shapes) ? shapes.length : 0
          });
          if (!adminId) throw new Error('Admin ID is required');

          await Guideline.updateMany({ scenario, isActive: true }, { isActive: false });
          const guideline = new Guideline({ scenario, shapes, createdBy: adminId, isActive: true });
          await guideline.save();

          console.log('[guidelines] saved', { id: guideline._id.toString(), scenario });
          this.io.emit('guidelines:updated', { scenario, shapes, setBy: 'admin', timestamp: new Date() });
          socket.emit('admin:guidelinesSaved', { success: true, id: guideline._id });
        } catch (error) {
          console.error('Error saving guidelines:', error);
          socket.emit('admin:guidelinesError', { error: error.message });
        }
      });

      socket.on('admin:updateGuidelines', async (data) => {
        try {
          const { scenario, shapes, adminId } = data;
          const existing = await Guideline.findOne({ scenario, isActive: true });
          if (existing) {
            existing.shapes = shapes;
            existing.updatedAt = new Date();
            await existing.save();
          } else {
            const guideline = new Guideline({ scenario, shapes, createdBy: adminId, isActive: true });
            await guideline.save();
          }
          this.io.emit('guidelines:updated', { scenario, shapes, setBy: 'admin', timestamp: new Date() });
          socket.emit('admin:guidelinesUpdated', { success: true });
        } catch (error) {
          console.error('Error updating guidelines:', error);
          socket.emit('admin:guidelinesError', { error: error.message });
        }
      });

      socket.on('user:getGuidelines', async (data) => {
        try {
          const { scenario } = data;
          const guideline = await Guideline.findOne({ scenario, isActive: true });
          console.log('[guidelines] user:getGuidelines', scenario, 'found:', !!guideline);
          socket.emit('user:guidelinesReceived', {
            scenario,
            shapes: guideline ? guideline.shapes : [],
            setBy: guideline ? 'admin' : 'none',
            timestamp: guideline ? guideline.updatedAt : null
          });
        } catch (error) {
          console.error('Error getting guidelines:', error);
          socket.emit('user:guidelinesError', { error: error.message });
        }
      });

      socket.on('admin:clearGuidelines', async (data) => {
        try {
          const { scenario } = data;
          await Guideline.updateMany({ scenario, isActive: true }, { isActive: false });
          this.io.emit('guidelines:cleared', { scenario, timestamp: new Date() });
          socket.emit('admin:guidelinesCleared', { success: true });
        } catch (error) {
          console.error('Error clearing guidelines:', error);
          socket.emit('admin:guidelinesError', { error: error.message });
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
