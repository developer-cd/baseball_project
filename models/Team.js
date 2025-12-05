import mongoose from "mongoose";
import crypto from "crypto";

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  passcode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  maxSeats: {
    type: Number,
    default: 20,
    min: 1,
    max: 20
  },
  currentSeats: {
    type: Number,
    default: 0,
    min: 0
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  subscriptionEndDate: {
    type: Date,
    required: true
  },
  pricingType: {
    type: String,
    enum: ['individual', 'organization'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for faster queries
// Note: passcode already has unique index from unique: true
teamSchema.index({ organizationId: 1 });
teamSchema.index({ coachId: 1 });
teamSchema.index({ subscriptionStatus: 1 });
teamSchema.index({ isActive: 1 });

// Generate unique passcode before validation so it satisfies required constraint
teamSchema.pre('validate', async function(next) {
  if (this.isNew && !this.passcode) {
    // Generate 6-character alphanumeric passcode
    let passcode;
    let isUnique = false;
    
    while (!isUnique) {
      passcode = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
      const existingTeam = await mongoose.model('Team').findOne({ passcode });
      if (!existingTeam) {
        isUnique = true;
      }
    }
    
    this.passcode = passcode;
  }
  next();
});

// Virtual to check if team has available seats
teamSchema.virtual('availableSeats').get(function() {
  return Math.max(0, this.maxSeats - this.currentSeats);
});

// Virtual to check if team is full
teamSchema.virtual('isFull').get(function() {
  return this.currentSeats >= this.maxSeats;
});

export default mongoose.model('Team', teamSchema);

