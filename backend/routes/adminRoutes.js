import express from 'express';
import FieldPosition from '../models/FieldPosition.js';
import { protect as authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly as adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Get all admin-set positions
router.get('/positions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const positions = await FieldPosition.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, positions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get positions for specific scenario
router.get('/positions/:scenario', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { scenario } = req.params;
    const fieldPosition = await FieldPosition.findOne({ scenario, isActive: true })
      .populate('createdBy', 'name email');
    
    if (fieldPosition) {
      res.json({ success: true, fieldPosition });
    } else {
      res.json({ success: true, fieldPosition: null });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save admin positions (REST API backup)
router.post('/positions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { scenario, positions } = req.body;
    const adminId = req.user.id;

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

    res.json({ success: true, fieldPosition });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update admin positions
router.put('/positions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { positions } = req.body;

    const fieldPosition = await FieldPosition.findById(id);
    
    if (!fieldPosition) {
      return res.status(404).json({ success: false, error: 'Position not found' });
    }

    fieldPosition.positions = positions;
    fieldPosition.updatedAt = new Date();
    await fieldPosition.save();

    res.json({ success: true, fieldPosition });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear admin positions
router.delete('/positions/:scenario', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { scenario } = req.params;
    
    await FieldPosition.updateMany(
      { scenario, isActive: true },
      { isActive: false }
    );

    res.json({ success: true, message: 'Positions cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
