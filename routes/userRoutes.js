import express from 'express';
import FieldPosition from '../models/FieldPosition.js';
import CorrectPosition from '../models/CorrectPosition.js';
import { protect as authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get positions for specific scenario (for users)
router.get('/positions/:scenario', authMiddleware, async (req, res) => {
  try {
    const { scenario } = req.params;
    const fieldPosition = await FieldPosition.findOne({ scenario, isActive: true })
      .populate('createdBy', 'name email');
    
    if (fieldPosition) {
      res.json({ 
        success: true, 
        hasAdminPositions: true,
        positions: fieldPosition.positions,
        setBy: 'admin',
        timestamp: fieldPosition.updatedAt,
        adminName: fieldPosition.createdBy.name
      });
    } else {
      res.json({ 
        success: true, 
        hasAdminPositions: false,
        positions: null,
        setBy: 'none',
        timestamp: null,
        adminName: null
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all scenarios (for user dashboard)
router.get('/scenarios', authMiddleware, async (req, res) => {
  try {
    const Scenario = (await import('../models/Scenario.js')).default;
    let scenarios = await Scenario.find({ isActive: true })
      .select('name description icon createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    // If no scenarios exist, return default Base Positions scenario
    if (scenarios.length === 0) {
      scenarios = [{
        name: 'Base Positions',
        description: 'Starting defensive positions',
        icon: '🏟️',
        createdAt: new Date()
      }];
    }
    
    res.json({ success: true, scenarios });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    // Return default scenario on error
    res.json({ 
      success: true, 
      scenarios: [{
        name: 'Base Positions',
        description: 'Starting defensive positions',
        icon: '🏟️'
      }]
    });
  }
});

// Get correct positions for validation (for users)
router.get('/correct-positions/:scenario', authMiddleware, async (req, res) => {
  try {
    const { scenario } = req.params;
    const correctPosition = await CorrectPosition.findOne({ scenario, isActive: true });
    
    if (correctPosition) {
      res.json({ 
        success: true, 
        hasCorrectPositions: true,
        positions: correctPosition.positions
      });
    } else {
      res.json({ 
        success: true, 
        hasCorrectPositions: false,
        positions: null
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
