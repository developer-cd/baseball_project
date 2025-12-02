import mongoose from "mongoose";

const guidelineShapeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['line', 'arrow', 'dottedArrow'], required: true },
  points: { type: [Number], required: true },
  stroke: { type: String, default: '#000000' },
  strokeWidth: { type: Number, default: 3 },
});

const guidelineSchema = new mongoose.Schema({
  scenario: {
    type: String,
    required: true
  },
  shapes: { type: [guidelineShapeSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

guidelineSchema.index({ scenario: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.model('Guideline', guidelineSchema);


