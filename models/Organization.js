import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['individual', 'organization'],
    required: true,
    default: 'individual'
  },
  // Plan / subscription related fields
  planType: {
    type: String,
    enum: ['individual', 'organization'],
    default: 'individual'
  },
  hasActiveSubscription: {
    type: Boolean,
    default: false
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
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ type: 1 });
organizationSchema.index({ isActive: 1 });

// Update the updatedAt field before saving
organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Organization', organizationSchema);


