import express from 'express';
import FieldPosition from '../models/FieldPosition.js';
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

// Get all scenarios with admin positions
router.get('/scenarios', authMiddleware, async (req, res) => {
  try {
    const scenarios = await FieldPosition.find({ isActive: true })
      .populate('createdBy', 'name email')
      .select('scenario updatedAt createdBy')
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, scenarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
