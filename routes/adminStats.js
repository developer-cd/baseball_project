import express from 'express';
import User from '../models/User.js';
import FieldPosition from '../models/FieldPosition.js';
import Scenario from '../models/Scenario.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { generateRegistrationToken, generateRegistrationLink } from '../utils/tokenGenerator.js';

const router = express.Router();

// Test endpoint to check database connection
router.get('/test-db', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const users = await User.find().select('username email role').limit(5);
    
    res.json({
      success: true,
      message: 'Database connection working',
      userCount,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});

// Get admin dashboard statistics
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get active users (logged in within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: oneDayAgo }
    });
    
    // Get total sessions (field positions created)
    const totalSessions = await FieldPosition.countDocuments();
    
    // Get sessions this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sessionsThisWeek = await FieldPosition.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });
    
    // Get scenarios count from Scenario model (not FieldPosition)
    const scenariosCount = await Scenario.countDocuments({ isActive: true });
    
    // Get recent activity (last 10 activities)
    const recentActivity = await FieldPosition.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'username email')
      .select('scenario createdAt createdBy')
      .lean();
    
    // Format recent activity
    const formattedActivity = recentActivity.map(activity => ({
      type: 'Position Set',
      description: `Positions set for "${activity.scenario}"`,
      user: activity.createdBy ? activity.createdBy.username : 'Unknown',
      timestamp: activity.createdAt,
      timeAgo: getTimeAgo(activity.createdAt)
    }));
    
    // Get user registration stats for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get most active scenarios
    const popularScenarios = await FieldPosition.aggregate([
      {
        $group: {
          _id: '$scenario',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    const stats = {
      totalUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      activeUsers,
      totalSessions,
      sessionsThisWeek,
      scenariosCount,
      newUsersThisMonth,
      popularScenarios,
      recentActivity: formattedActivity
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Get user list for admin dashboard
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    // Format user data
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000),
      joinedAt: user.createdAt,
      lastLogin: user.lastLogin
    }));
    
    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page * limit < totalUsers,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Create new user (admin only)
router.post('/users', protect, adminOnly, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Validate role
    const validRoles = ['user', 'coach', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, coach, or admin'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    console.log('Creating new user:', { username, email, role });
    const newUser = new User({
      username,
      email,
      password, // Will be hashed by the pre-save middleware
      role
    });
    
    // If creating a coach, generate registration token and link
    let registrationToken = null;
    let registrationLink = null;
    if (role === 'coach') {
      registrationToken = generateRegistrationToken();
      newUser.registrationToken = registrationToken;
      registrationLink = generateRegistrationLink(registrationToken);
      console.log('Generated registration token for coach:', registrationToken);
    }
    
    console.log('Saving user to database...');
    await newUser.save();
    console.log('User saved successfully:', newUser._id);
    
    // Return user data without password
    const userData = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    };
    
    // Include registration link if coach was created
    if (role === 'coach' && registrationLink) {
      userData.registrationLink = registrationLink;
      userData.registrationToken = registrationToken;
    }
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userData
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Delete user (admin only)
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Update user (admin only)
router.put('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Validate role
    const validRoles = ['user', 'coach', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, coach, or admin'
      });
    }
    
    // Check for duplicate email (if email is being changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Check for duplicate username (if username is being changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }
    
    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Get coach registration link and team info (admin only)
router.get('/coaches/:coachId/registration-link', protect, adminOnly, async (req, res) => {
  try {
    const { coachId } = req.params;
    
    const coach = await User.findById(coachId).select('username email registrationToken role');
    
    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }
    
    if (coach.role !== 'coach') {
      return res.status(400).json({
        success: false,
        message: 'User is not a coach'
      });
    }
    
    // If coach doesn't have a registration token, generate one
    if (!coach.registrationToken) {
      const registrationToken = generateRegistrationToken();
      coach.registrationToken = registrationToken;
      await coach.save();
    }
    
    // Get team members count
    const teamMembersCount = await User.countDocuments({ 
      coachId: coach._id,
      role: 'user'
    });
    
    // Generate registration link
    const registrationLink = generateRegistrationLink(coach.registrationToken);
    
    res.json({
      success: true,
      data: {
        coach: {
          _id: coach._id,
          username: coach.username,
          email: coach.email
        },
        registrationLink,
        registrationToken: coach.registrationToken,
        teamInfo: {
          currentMembers: teamMembersCount,
          maxMembers: 15,
          availableSlots: 15 - teamMembersCount
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching coach registration link:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registration link',
      error: error.message
    });
  }
});

// Get coach team members (admin only)
router.get('/coaches/:coachId/team', protect, adminOnly, async (req, res) => {
  try {
    const { coachId } = req.params;
    
    const coach = await User.findById(coachId).select('username email role');
    
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }
    
    // Get team members
    const teamMembers = await User.find({ 
      coachId: coach._id,
      role: 'user'
    })
    .select('username email createdAt lastLogin')
    .sort({ createdAt: -1 })
    .lean();
    
    const teamMembersCount = teamMembers.length;
    
    res.json({
      success: true,
      data: {
        coach: {
          _id: coach._id,
          username: coach.username,
          email: coach.email
        },
        teamMembers,
        teamInfo: {
          currentMembers: teamMembersCount,
          maxMembers: 15,
          availableSlots: 15 - teamMembersCount
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching coach team:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team members',
      error: error.message
    });
  }
});

// Helper function to get time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
  return `${Math.floor(diffInSeconds / 86400)} day ago`;
}

export default router;
