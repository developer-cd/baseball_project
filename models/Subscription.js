import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  // Optional: teamId was used in per-team billing. For plan-level subscriptions
  // this can be null, but we keep it for backward compatibility / analytics.
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
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
  stripeCustomerId: {
    type: String,
    required: true,
    trim: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  pricingType: {
    type: String,
    enum: ['individual', 'organization'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'unpaid', 'trialing'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly'],
    default: 'quarterly' // 3 months
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
// Note: stripeSubscriptionId already has unique index from unique: true
subscriptionSchema.index({ organizationId: 1 });
subscriptionSchema.index({ coachId: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
// Ensure at most one active subscription per coach+organization
subscriptionSchema.index(
  { coachId: 1, organizationId: 1, isActive: 1 },
  { unique: false }
);

// Update the updatedAt field before saving
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual to check if subscription is expired
subscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Virtual to check if subscription is active
subscriptionSchema.virtual('isActiveSubscription').get(function() {
  return this.status === 'active' && !this.isExpired && this.isActive;
});

export default mongoose.model('Subscription', subscriptionSchema);

