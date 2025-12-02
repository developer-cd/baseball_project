import mongoose from "mongoose";

const fieldPositionSchema = new mongoose.Schema({
  scenario: {
    type: String,
    required: true
  },
  positions: {
    type: Map,
    of: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      color: { type: String, required: true },
      label: { type: String, required: true }
    },
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Ensure only one active position per scenario
fieldPositionSchema.index({ scenario: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.model('FieldPosition', fieldPositionSchema);
