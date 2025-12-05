import mongoose from "mongoose";

const playerTeamSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'removed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Composite unique index to prevent duplicate player-team relationships
playerTeamSchema.index({ playerId: 1, teamId: 1 }, { unique: true });

// Indexes for faster queries
playerTeamSchema.index({ playerId: 1 });
playerTeamSchema.index({ teamId: 1 });
playerTeamSchema.index({ status: 1 });

// Update the updatedAt field before saving
playerTeamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware to update team's currentSeats when player joins/leaves
playerTeamSchema.post('save', async function() {
  if (this.status === 'active') {
    await mongoose.model('Team').updateOne(
      { _id: this.teamId },
      { $inc: { currentSeats: 1 } }
    );
  }
});

playerTeamSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status) {
    const Team = mongoose.model('Team');
    const team = await Team.findById(doc.teamId);
    
    if (doc.status === 'active') {
      // Count active players for this team
      const activeCount = await mongoose.model('PlayerTeam').countDocuments({
        teamId: doc.teamId,
        status: 'active'
      });
      await Team.updateOne(
        { _id: doc.teamId },
        { currentSeats: activeCount }
      );
    } else {
      // Decrease count if player is removed/inactive
      const activeCount = await mongoose.model('PlayerTeam').countDocuments({
        teamId: doc.teamId,
        status: 'active'
      });
      await Team.updateOne(
        { _id: doc.teamId },
        { currentSeats: activeCount }
      );
    }
  }
});

playerTeamSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    // Recalculate team seats
    const activeCount = await mongoose.model('PlayerTeam').countDocuments({
      teamId: doc.teamId,
      status: 'active'
    });
    await mongoose.model('Team').updateOne(
      { _id: doc.teamId },
      { currentSeats: activeCount }
    );
  }
});

export default mongoose.model('PlayerTeam', playerTeamSchema);




