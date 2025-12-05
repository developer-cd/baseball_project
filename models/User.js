import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { 
      type: String, 
      required: function() {
        // Email required for coaches and admins, optional for players
        return this.role === 'coach' || this.role === 'admin';
      },
      unique: true,
      sparse: true // Allows multiple null values
    },
    phone: { type: String },
    password: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    role: { type: String, enum: ["user", "admin", "coach"], default: "user" },
    address: { type: String },

    // 👇 Team/Coach Related Fields (Legacy - kept for backward compatibility)
    coachId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    }, // DEPRECATED: Use PlayerTeam model instead
    
    // 👇 New Organization/Team Structure
    organizationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Organization", 
      default: null 
    }, // For coaches - which organization they belong to
    isOrganizationOwner: { 
      type: Boolean, 
      default: false 
    }, // True if coach owns the organization
    
    // 👇 Payment Related Fields
    stripeCustomerId: { 
      type: String, 
      unique: true, 
      sparse: true, 
      trim: true 
    }, // Stripe customer ID for payment processing
    
    // 👇 Player Registration Type
    playerType: { 
      type: String, 
      enum: ["email", "passcode"], 
      default: "email" 
    }, // How player registered (email or passcode)
    
    // 👇 Registration Token (for coaches - passcode generation)
    registrationToken: { 
      type: String, 
      unique: true, 
      sparse: true 
    }, // For coaches - unique registration link token

    // 👇 Auth Related Fields
    refreshToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Indexes for faster queries
// Note: stripeCustomerId already has unique index from unique: true
userSchema.index({ organizationId: 1 });
userSchema.index({ isOrganizationOwner: 1 });
userSchema.index({ playerType: 1 });
userSchema.index({ coachId: 1 }); // Keep for backward compatibility

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return next();
  }
  
  try {
    console.log('Hashing password for user:', this.username);
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

export default mongoose.model("User", userSchema);
