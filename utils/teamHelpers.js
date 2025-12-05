/**
 * Team Helper Utilities
 * Functions to work with Team and PlayerTeam models
 * Supports both new structure (Team/PlayerTeam) and legacy (coachId)
 */

import Team from '../models/Team.js';
import PlayerTeam from '../models/PlayerTeam.js';
import User from '../models/User.js';

/**
 * Get all teams for a coach
 * @param {String} coachId - Coach user ID
 * @returns {Array} Array of team documents
 */
export const getCoachTeams = async (coachId) => {
  try {
    const teams = await Team.find({ 
      coachId: coachId,
      isActive: true
    }).populate('organizationId', 'name type');
    
    return teams;
  } catch (error) {
    console.error('Error getting coach teams:', error);
    throw error;
  }
};

/**
 * Get all players in a team
 * @param {String} teamId - Team ID
 * @returns {Array} Array of player documents
 */
export const getTeamPlayers = async (teamId) => {
  try {
    const playerTeams = await PlayerTeam.find({
      teamId: teamId,
      status: 'active'
    }).populate('playerId', 'username email createdAt lastLogin');
    
    return playerTeams.map(pt => ({
      ...pt.playerId.toObject(),
      joinedAt: pt.joinedAt
    }));
  } catch (error) {
    console.error('Error getting team players:', error);
    throw error;
  }
};

/**
 * Get all players for a coach (across all teams)
 * Uses new Team/PlayerTeam structure if available, falls back to legacy coachId
 * @param {String} coachId - Coach user ID
 * @returns {Array} Array of player documents
 */
export const getCoachPlayers = async (coachId) => {
  try {
    // Try new structure first (Team/PlayerTeam)
    const teams = await Team.find({ 
      coachId: coachId,
      isActive: true
    }).select('_id');
    
    if (teams.length > 0) {
      // Use new structure
      const teamIds = teams.map(t => t._id);
      const playerTeams = await PlayerTeam.find({
        teamId: { $in: teamIds },
        status: 'active'
      }).populate('playerId', 'username email createdAt lastLogin role');
      
      return playerTeams.map(pt => pt.playerId.toObject());
    } else {
      // Fallback to legacy structure (coachId)
      const players = await User.find({
        role: 'user',
        coachId: coachId
      }).select('username email createdAt lastLogin role');
      
      return players;
    }
  } catch (error) {
    console.error('Error getting coach players:', error);
    throw error;
  }
};

/**
 * Get team count for a coach
 * @param {String} coachId - Coach user ID
 * @returns {Number} Number of teams
 */
export const getCoachTeamCount = async (coachId) => {
  try {
    const count = await Team.countDocuments({
      coachId: coachId,
      isActive: true
    });
    return count;
  } catch (error) {
    console.error('Error getting coach team count:', error);
    throw error;
  }
};

/**
 * Get player count for a team
 * @param {String} teamId - Team ID
 * @returns {Number} Number of active players
 */
export const getTeamPlayerCount = async (teamId) => {
  try {
    const count = await PlayerTeam.countDocuments({
      teamId: teamId,
      status: 'active'
    });
    return count;
  } catch (error) {
    console.error('Error getting team player count:', error);
    throw error;
  }
};

/**
 * Check if team has available seats
 * @param {String} teamId - Team ID
 * @returns {Object} { available: boolean, currentSeats: number, maxSeats: number }
 */
export const checkTeamAvailability = async (teamId) => {
  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return { available: false, currentSeats: 0, maxSeats: 0 };
    }
    
    const currentSeats = await getTeamPlayerCount(teamId);
    const available = currentSeats < team.maxSeats;
    
    return {
      available,
      currentSeats,
      maxSeats: team.maxSeats,
      availableSeats: team.maxSeats - currentSeats
    };
  } catch (error) {
    console.error('Error checking team availability:', error);
    throw error;
  }
};

/**
 * Add player to team
 * @param {String} playerId - Player user ID
 * @param {String} teamId - Team ID
 * @returns {Object} PlayerTeam document
 */
export const addPlayerToTeam = async (playerId, teamId) => {
  try {
    // Check if already in team
    const existing = await PlayerTeam.findOne({
      playerId: playerId,
      teamId: teamId
    });
    
    if (existing) {
      if (existing.status === 'active') {
        throw new Error('Player is already in this team');
      } else {
        // Reactivate
        existing.status = 'active';
        await existing.save();
        return existing;
      }
    }
    
    // Check team availability
    const availability = await checkTeamAvailability(teamId);
    if (!availability.available) {
      throw new Error(`Team is full. Maximum ${availability.maxSeats} players allowed.`);
    }
    
    // Create PlayerTeam relationship
    const playerTeam = new PlayerTeam({
      playerId: playerId,
      teamId: teamId,
      status: 'active'
    });
    
    await playerTeam.save();
    
    // Update team currentSeats (handled by middleware, but ensure it's correct)
    const team = await Team.findById(teamId);
    if (team) {
      team.currentSeats = availability.currentSeats + 1;
      await team.save();
    }
    
    return playerTeam;
  } catch (error) {
    console.error('Error adding player to team:', error);
    throw error;
  }
};

/**
 * Remove player from team
 * @param {String} playerId - Player user ID
 * @param {String} teamId - Team ID
 * @returns {Boolean} Success status
 */
export const removePlayerFromTeam = async (playerId, teamId) => {
  try {
    const playerTeam = await PlayerTeam.findOne({
      playerId: playerId,
      teamId: teamId
    });
    
    if (!playerTeam) {
      return false;
    }
    
    playerTeam.status = 'removed';
    await playerTeam.save();
    
    // Update team currentSeats
    const team = await Team.findById(teamId);
    if (team) {
      const currentSeats = await getTeamPlayerCount(teamId);
      team.currentSeats = currentSeats;
      await team.save();
    }
    
    return true;
  } catch (error) {
    console.error('Error removing player from team:', error);
    throw error;
  }
};

/**
 * Get team by passcode
 * @param {String} passcode - Team passcode
 * @returns {Object} Team document or null
 */
export const getTeamByPasscode = async (passcode) => {
  try {
    const team = await Team.findOne({
      passcode: passcode.toUpperCase(),
      isActive: true
    }).populate('organizationId', 'name type')
      .populate('coachId', 'username email');
    
    return team;
  } catch (error) {
    console.error('Error getting team by passcode:', error);
    throw error;
  }
};

/**
 * Get player's teams
 * @param {String} playerId - Player user ID
 * @returns {Array} Array of team documents
 */
export const getPlayerTeams = async (playerId) => {
  try {
    const playerTeams = await PlayerTeam.find({
      playerId: playerId,
      status: 'active'
    }).populate('teamId', 'name passcode maxSeats currentSeats subscriptionStatus');
    
    return playerTeams.map(pt => ({
      ...pt.teamId.toObject(),
      joinedAt: pt.joinedAt
    }));
  } catch (error) {
    console.error('Error getting player teams:', error);
    throw error;
  }
};




