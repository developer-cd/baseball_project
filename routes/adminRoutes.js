import express from 'express';
import FieldPosition from '../models/FieldPosition.js';
import Scenario from '../models/Scenario.js';
import CorrectPosition from '../models/CorrectPosition.js';
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

// ========== SCENARIO ROUTES ==========

// Get all scenarios
router.get('/scenarios', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const scenarios = await Scenario.find({ isActive: true })
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, scenarios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single scenario
router.get('/scenarios/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const scenario = await Scenario.findById(id)
      .populate('createdBy', 'username email');
    
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    
    res.json({ success: true, scenario });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new scenario
router.post('/scenarios', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const adminId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Scenario name is required' });
    }

    // Check if scenario with same name already exists
    const existingScenario = await Scenario.findOne({ 
      name: name.trim(),
      isActive: true 
    });

    if (existingScenario) {
      return res.status(400).json({ 
        success: false, 
        error: 'Scenario with this name already exists' 
      });
    }

    const scenario = new Scenario({
      name: name.trim(),
      description: description || '',
      icon: icon || '⚾',
      createdBy: adminId,
      isActive: true
    });

    await scenario.save();
    await scenario.populate('createdBy', 'username email');

    res.json({ success: true, scenario });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Scenario with this name already exists' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update scenario
router.put('/scenarios/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const scenario = await Scenario.findById(id);
    
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }

    // Check if new name conflicts with existing scenario
    if (name && name.trim() !== scenario.name) {
      const existingScenario = await Scenario.findOne({ 
        name: name.trim(),
        isActive: true,
        _id: { $ne: id }
      });

      if (existingScenario) {
        return res.status(400).json({ 
          success: false, 
          error: 'Scenario with this name already exists' 
        });
      }

      scenario.name = name.trim();
    }

    if (description !== undefined) scenario.description = description || '';
    if (icon !== undefined) scenario.icon = icon || '⚾';
    scenario.updatedAt = new Date();

    await scenario.save();
    await scenario.populate('createdBy', 'username email');

    res.json({ success: true, scenario });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Scenario with this name already exists' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete scenario (soft delete)
router.delete('/scenarios/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const scenario = await Scenario.findById(id);
    
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }

    scenario.isActive = false;
    scenario.updatedAt = new Date();
    await scenario.save();

    res.json({ success: true, message: 'Scenario deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== CORRECT POSITIONS ROUTES ==========

// Get correct positions for a scenario
router.get('/correct-positions/:scenario', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { scenario } = req.params;
    const correctPosition = await CorrectPosition.findOne({ scenario, isActive: true })
      .populate('createdBy', 'username email');
    
    if (correctPosition) {
      res.json({ success: true, correctPosition });
    } else {
      res.json({ success: true, correctPosition: null });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save correct positions for validation
router.post('/correct-positions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { scenario, positions } = req.body;
    const adminId = req.user.id;

    if (!scenario || !positions) {
      return res.status(400).json({ success: false, error: 'Scenario and positions are required' });
    }

    // Deactivate previous correct positions for this scenario
    await CorrectPosition.updateMany(
      { scenario, isActive: true },
      { isActive: false }
    );

    // Create new correct position record
    const correctPosition = new CorrectPosition({
      scenario,
      positions,
      createdBy: adminId,
      isActive: true
    });

    await correctPosition.save();
    await correctPosition.populate('createdBy', 'username email');

    res.json({ success: true, correctPosition });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update correct positions
router.put('/correct-positions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { positions } = req.body;

    const correctPosition = await CorrectPosition.findById(id);
    
    if (!correctPosition) {
      return res.status(404).json({ success: false, error: 'Correct position not found' });
    }

    correctPosition.positions = positions;
    correctPosition.updatedAt = new Date();
    await correctPosition.save();
    await correctPosition.populate('createdBy', 'username email');

    res.json({ success: true, correctPosition });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear correct positions
router.delete('/correct-positions/:scenario', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { scenario } = req.params;
    
    await CorrectPosition.updateMany(
      { scenario, isActive: true },
      { isActive: false }
    );

    res.json({ success: true, message: 'Correct positions cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
