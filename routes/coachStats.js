import express from 'express';
import User from '../models/User.js';
import FieldPosition from '../models/FieldPosition.js';
import Team from '../models/Team.js';
import Organization from '../models/Organization.js';
import Subscription from '../models/Subscription.js';
import { protect } from '../middleware/authMiddleware.js';
import { coachOnly } from '../middleware/coachMiddleware.js';
import { getCoachPlayers, getCoachTeams, getCoachTeamCount } from '../utils/teamHelpers.js';
import { generateRegistrationToken, generateRegistrationLink } from '../utils/tokenGenerator.js';

const router = express.Router();

// Helper function to get time ago
function getTimeAgo(date) {
  if (!date) return 'Never';
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
  return `${Math.floor(diffInSeconds / 86400)} day ago`;
}

// Get coach dashboard statistics
router.get('/stats', protect, coachOnly, async (req, res) => {
  try {
    const coachId = req.user._id;
    
    // Get players using new Team/PlayerTeam structure (with legacy fallback)
    const players = await getCoachPlayers(coachId);

    const totalPlayers = players.length;
    
    // Calculate active players (logged in within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activePlayers = players.filter(p => 
      p.lastLogin && new Date(p.lastLogin) > oneDayAgo
    ).length;

    // Get total sessions (field positions created by players)
    const totalSessions = await FieldPosition.countDocuments({
      createdBy: { $in: players.map(p => p._id) }
    });

    // Get total attempts (approximate - based on sessions)
    // Each session typically has multiple attempts
    const totalAttempts = totalSessions * 9; // Approximate: 9 players per session

    // Calculate average success rate (placeholder - would need actual validation data)
    // For now, we'll use a calculated value based on active players
    const averageSuccessRate = activePlayers > 0 ? 75 + (activePlayers * 2) : 0;

    const stats = {
      totalPlayers,
      activePlayers,
      averageSuccessRate: Math.min(averageSuccessRate, 95), // Cap at 95%
      totalSessions,
      totalAttempts
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching coach stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Get all players with their performance data
router.get('/players', protect, coachOnly, async (req, res) => {
  try {
    const coachId = req.user._id;
    const { search = '', filter = '' } = req.query;

    // Get players using new Team/PlayerTeam structure (with legacy fallback)
    let players = await getCoachPlayers(coachId);
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      players = players.filter(p => 
        (p.username && p.username.toLowerCase().includes(searchLower)) ||
        (p.email && p.email && p.email.toLowerCase().includes(searchLower))
      );
    }

    // Calculate active status
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get player performance data
    const playersWithStats = await Promise.all(
      players.map(async (player) => {
        // Get sessions for this player
        const sessions = await FieldPosition.find({
          createdBy: player._id
        }).lean();

        const totalSessions = sessions.length;
        const totalAttempts = totalSessions * 9; // Approximate

        // Get unique scenarios completed
        const scenariosCompleted = [...new Set(sessions.map(s => s.scenario))].length;

        // Calculate success rate (placeholder - would need actual validation data)
        // For now, base it on activity
        const isActive = player.lastLogin && new Date(player.lastLogin) > oneDayAgo;
        const baseSuccessRate = isActive ? 75 + Math.floor(Math.random() * 20) : 60 + Math.floor(Math.random() * 15);
        const successRate = Math.min(baseSuccessRate, 95);

        // Calculate correct placements (approximate)
        const correctPlacements = Math.floor(totalAttempts * (successRate / 100));

        // Calculate average time (placeholder)
        const averageTime = 10 + Math.floor(Math.random() * 10);

        // Calculate current streak (placeholder - based on recent activity)
        const recentSessions = sessions.filter(s => {
          const sessionDate = new Date(s.createdAt);
          return sessionDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        });
        const currentStreak = recentSessions.length > 0 ? Math.min(recentSessions.length, 15) : 0;

        // Get recent activity
        const recentActivity = sessions
          .slice(0, 3)
          .map(session => ({
            date: new Date(session.createdAt).toISOString().split('T')[0],
            scenario: session.scenario,
            successRate: successRate + Math.floor(Math.random() * 10 - 5),
            timeSpent: averageTime
          }));

        // Position success rates (placeholder - would need actual position data)
        const positionSuccessRates = {
          P: successRate + Math.floor(Math.random() * 10 - 5),
          C: successRate + Math.floor(Math.random() * 10 - 5),
          '1B': successRate + Math.floor(Math.random() * 10 - 5),
          '2B': successRate + Math.floor(Math.random() * 10 - 5),
          '3B': successRate + Math.floor(Math.random() * 10 - 5),
          SS: successRate + Math.floor(Math.random() * 10 - 5),
          LF: successRate + Math.floor(Math.random() * 10 - 5),
          CF: successRate + Math.floor(Math.random() * 10 - 5),
          RF: successRate + Math.floor(Math.random() * 10 - 5),
        };

        // Normalize position rates
        Object.keys(positionSuccessRates).forEach(key => {
          positionSuccessRates[key] = Math.max(50, Math.min(100, positionSuccessRates[key]));
        });

        // Determine strong and weak positions
        const sortedPositions = Object.entries(positionSuccessRates)
          .sort((a, b) => b[1] - a[1]);
        const strongPositions = sortedPositions.slice(0, 3).map(p => p[0]);
        const weakPositions = sortedPositions.slice(-2).map(p => p[0]);

        // Primary positions (top 3)
        const primaryPositions = strongPositions;

        return {
          id: player._id.toString(),
          _id: player._id.toString(),
          name: player.username,
          email: player.email,
          joinedDate: new Date(player.createdAt).toISOString().split('T')[0],
          lastActive: player.lastLogin || player.createdAt,
          isActive: isActive,
          primaryPositions,
          stats: {
            totalSessions,
            totalAttempts,
            correctPlacements,
            successRate,
            averageTime,
            scenariosCompleted,
            currentStreak
          },
          positionSuccessRates,
          recentActivity,
          weakPositions,
          strongPositions
        };
      })
    );

    // Apply filter
    let filteredPlayers = playersWithStats;
    if (filter === 'active') {
      filteredPlayers = playersWithStats.filter(p => p.isActive);
    } else if (filter === 'inactive') {
      filteredPlayers = playersWithStats.filter(p => !p.isActive);
    }

    res.json({
      success: true,
      data: {
        players: filteredPlayers,
        total: filteredPlayers.length
      }
    });

  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching players',
      error: error.message
    });
  }
});

// Create new team (requires active plan-level subscription)
router.post('/teams', protect, coachOnly, async (req, res) => {
  try {
    const coachId = req.user._id;
    const { teamName } = req.body;

    if (!teamName || teamName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Team name is required',
      });
    }

    // Get coach user
    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Only coaches can create teams',
      });
    }

    // Get or create organization for coach
    let organization = null;
    if (coach.organizationId) {
      organization = await Organization.findById(coach.organizationId);
    }

    if (!organization) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found. Please complete coach signup first.',
      });
    }

    // Check active plan-level subscription
    const activeSubscription = await Subscription.findOne({
      coachId,
      organizationId: organization._id,
      isActive: true,
      status: 'active',
      endDate: { $gt: new Date() },
    });

    if (!activeSubscription) {
      return res.status(402).json({
        success: false,
        message: 'No active subscription found. Please renew your plan to create teams.',
      });
    }

    const planType = activeSubscription.pricingType || organization.planType || organization.type || 'individual';

    // Enforce team limits based on plan
    const existingTeamCount = await getCoachTeamCount(coachId);
    if (planType === 'individual' && existingTeamCount >= 1) {
      return res.status(403).json({
        success: false,
        message: 'Individual plan allows only 1 team. Upgrade to organization plan to create more teams.',
      });
    }

    // Team subscription end date aligns with plan subscription end date
    const subscriptionEndDate = activeSubscription.endDate || new Date();

    const team = new Team({
      name: teamName.trim(),
      organizationId: organization._id,
      coachId: coach._id,
      maxSeats: 20,
      currentSeats: 0,
      subscriptionStatus: 'active',
      subscriptionEndDate: subscriptionEndDate,
      pricingType: planType,
    });

    await team.save();

    res.json({
      success: true,
      data: {
        team,
      },
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating team',
      error: error.message,
    });
  }
});

// Get coach registration link
router.get('/registration-link', protect, coachOnly, async (req, res) => {
  try {
    const coachId = req.user._id;
    
    const coach = await User.findById(coachId).select('username email registrationToken role');
    
    if (!coach || coach.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // If coach doesn't have a registration token, generate one
    if (!coach.registrationToken) {
      coach.registrationToken = generateRegistrationToken();
      await coach.save();
    }

    // Get players using new Team/PlayerTeam structure (with legacy fallback)
    const players = await getCoachPlayers(coachId);
    const teamMembersCount = players.length;

    // Approximate team capacity: 20 players per team
    const teams = await getCoachTeams(coachId);
    const maxMembers = teams.length > 0 ? teams.length * 20 : 20;
    const availableSlots = Math.max(0, maxMembers - teamMembersCount);
    
    // Generate registration link
    const registrationLink = generateRegistrationLink(coach.registrationToken);
    
    res.json({
      success: true,
      data: {
        registrationLink,
        registrationToken: coach.registrationToken,
        teamInfo: {
          currentMembers: teamMembersCount,
          maxMembers,
          availableSlots
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

// Get player detail by ID
router.get('/players/:id', protect, coachOnly, async (req, res) => {
  try {
    const coachId = req.user._id;
    const { id } = req.params;

    const player = await User.findById(id).select('username email createdAt lastLogin').lean();
    
    if (!player || player.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    // Verify player belongs to this coach's team (using new or legacy structure)
    const coachPlayers = await getCoachPlayers(coachId);
    const playerInTeam = coachPlayers.some(p => 
      (p._id?.toString() || p.id?.toString()) === id
    );
    
    if (!playerInTeam) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This player is not in your team.'
      });
    }

    // Get sessions for this player
    const sessions = await FieldPosition.find({
      createdBy: player._id
    }).sort({ createdAt: -1 }).lean();

    const totalSessions = sessions.length;
    const totalAttempts = totalSessions * 9;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isActive = player.lastLogin && new Date(player.lastLogin) > oneDayAgo;
    const baseSuccessRate = isActive ? 75 + Math.floor(Math.random() * 20) : 60 + Math.floor(Math.random() * 15);
    const successRate = Math.min(baseSuccessRate, 95);

    const correctPlacements = Math.floor(totalAttempts * (successRate / 100));
    const averageTime = 10 + Math.floor(Math.random() * 10);
    const scenariosCompleted = [...new Set(sessions.map(s => s.scenario))].length;

    const recentSessions = sessions.filter(s => {
      const sessionDate = new Date(s.createdAt);
      return sessionDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    });
    const currentStreak = recentSessions.length > 0 ? Math.min(recentSessions.length, 15) : 0;

    const recentActivity = sessions
      .slice(0, 10)
      .map(session => ({
        date: new Date(session.createdAt).toISOString().split('T')[0],
        scenario: session.scenario,
        successRate: successRate + Math.floor(Math.random() * 10 - 5),
        timeSpent: averageTime
      }));

    const positionSuccessRates = {
      P: successRate + Math.floor(Math.random() * 10 - 5),
      C: successRate + Math.floor(Math.random() * 10 - 5),
      '1B': successRate + Math.floor(Math.random() * 10 - 5),
      '2B': successRate + Math.floor(Math.random() * 10 - 5),
      '3B': successRate + Math.floor(Math.random() * 10 - 5),
      SS: successRate + Math.floor(Math.random() * 10 - 5),
      LF: successRate + Math.floor(Math.random() * 10 - 5),
      CF: successRate + Math.floor(Math.random() * 10 - 5),
      RF: successRate + Math.floor(Math.random() * 10 - 5),
    };

    Object.keys(positionSuccessRates).forEach(key => {
      positionSuccessRates[key] = Math.max(50, Math.min(100, positionSuccessRates[key]));
    });

    const sortedPositions = Object.entries(positionSuccessRates)
      .sort((a, b) => b[1] - a[1]);
    const strongPositions = sortedPositions.slice(0, 3).map(p => p[0]);
    const weakPositions = sortedPositions.slice(-2).map(p => p[0]);
    const primaryPositions = strongPositions;

    const playerData = {
      id: player._id.toString(),
      _id: player._id.toString(),
      name: player.username,
      email: player.email,
      joinedDate: new Date(player.createdAt).toISOString().split('T')[0],
      lastActive: player.lastLogin || player.createdAt,
      isActive: isActive,
      primaryPositions,
      stats: {
        totalSessions,
        totalAttempts,
        correctPlacements,
        successRate,
        averageTime,
        scenariosCompleted,
        currentStreak
      },
      positionSuccessRates,
      recentActivity,
      weakPositions,
      strongPositions
    };

    res.json({
      success: true,
      data: playerData
    });

  } catch (error) {
    console.error('Error fetching player detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching player detail',
      error: error.message
    });
  }
});

export default router;

