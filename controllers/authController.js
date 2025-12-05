import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { getCoachPlayers, checkTeamAvailability, addPlayerToTeam, getTeamByPasscode } from "../utils/teamHelpers.js";
import Team from "../models/Team.js";
import stripeService, { createCustomer, createCheckoutSession } from "../services/stripeService.js";

// Helper: generate tokens
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "24h" }); // Changed from 15m to 24h
};
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// ✅ Coach Self Registration (Coach Signup)
export const registerCoach = async (req, res) => {
  try {
    const { username, email, password, organizationName, accountType } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    // Validate account type
    const normalizedAccountType = (accountType || "individual").toLowerCase().trim();
    const validAccountTypes = ["individual", "organization"];
    if (!validAccountTypes.includes(normalizedAccountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type. Must be 'individual' or 'organization'",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create coach user
    const coachUser = new User({
      username,
      email,
      password, // Will be hashed by pre-save middleware
      role: "coach",
      isOrganizationOwner: true,
      playerType: "email",
    });

    await coachUser.save();

    // Create organization for this coach
    const org = new Organization({
      name: organizationName && organizationName.trim() !== "" ? organizationName.trim() : `${username}'s ${normalizedAccountType === "organization" ? "Organization" : "Team"}`,
      ownerId: coachUser._id,
      type: normalizedAccountType,
      planType: normalizedAccountType,
      hasActiveSubscription: false,
    });

    await org.save();

    // Link user to organization
    coachUser.organizationId = org._id;
    await coachUser.save();

    // ===== Stripe Plan Subscription (signup-time) =====
    // Determine plan price based on account type
    const planAmount = normalizedAccountType === "organization" ? 249 : 299; // 3-month plan pricing
    const pricingType = normalizedAccountType; // 'individual' | 'organization'

    // Ensure Stripe customer exists for this coach
    let stripeCustomerId = coachUser.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createCustomer({
        email: coachUser.email,
        name: coachUser.username,
        metadata: {
          userId: coachUser._id.toString(),
          userRole: coachUser.role,
        },
      });

      stripeCustomerId = customer.id;
      coachUser.stripeCustomerId = stripeCustomerId;
      await coachUser.save();
    }

    // Create Stripe checkout session for plan subscription
    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      amount: planAmount,
      teamId: null, // plan-level, not per-team
      organizationId: org._id.toString(),
      coachId: coachUser._id.toString(),
      pricingType,
    });

    // Return checkout URL to frontend
    res.status(201).json({
      success: true,
      message: "Coach account created. Redirecting to payment...",
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Coach registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Register via Coach Team Link (Token-based registration)
export const registerViaToken = async (req, res) => {
  try {
    const { token, username, email, password } = req.body;
    
    // Validate required fields
    if (!token || !username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Token, username, email, and password are required" 
      });
    }
    
    // Find coach by registration token
    const coach = await User.findOne({ 
      registrationToken: token,
      role: 'coach'
    });
    
    if (!coach) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired registration token" 
      });
    }
    
    // Find coach's first active team (for new structure)
    // If no team exists, we'll use legacy coachId approach
    let team = await Team.findOne({ 
      coachId: coach._id,
      isActive: true
    }).sort({ createdAt: 1 }); // Get first team
    
    // Check team availability (new structure) or legacy count
    let teamAvailability;
    if (team) {
      // Use new Team structure
      teamAvailability = await checkTeamAvailability(team._id);
      if (!teamAvailability.available) {
        return res.status(400).json({ 
          success: false,
          message: `Team is full. Maximum ${teamAvailability.maxSeats} members allowed.` 
        });
      }
    } else {
      // Fallback to legacy structure
      const teamMembersCount = await User.countDocuments({ 
        coachId: coach._id,
        role: 'user'
      });
      
      if (teamMembersCount >= 15) {
        return res.status(400).json({ 
          success: false,
          message: "Coach team is full. Maximum 15 members allowed." 
        });
      }
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
        message: "User with this email or username already exists" 
      });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password, // Will be hashed by pre-save middleware
      role: 'user',
      playerType: 'email', // Registered via email
      // Keep coachId for backward compatibility
      coachId: coach._id
    });
    
    await newUser.save();
    
    // Add to team if using new structure
    if (team) {
      try {
        await addPlayerToTeam(newUser._id, team._id);
      } catch (error) {
        // If adding to team fails, user is still created with coachId
        console.error('Error adding player to team:', error);
      }
    }
    
    // Generate tokens for auto-login
    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);
    
    newUser.refreshToken = refreshToken;
    await newUser.save();
    
    // Return user data without password
    const userData = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      coachId: newUser.coachId,
      createdAt: newUser.createdAt
    };
    
    res.status(201).json({
      success: true,
      message: "Registration successful. You have been added to the coach's team.",
      accessToken,
      refreshToken,
      user: userData
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Validate Registration Token
export const validateRegistrationToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: "Token is required" 
      });
    }
    
    // Find coach by registration token
    const coach = await User.findOne({ 
      registrationToken: token,
      role: 'coach'
    }).select('username email');
    
    if (!coach) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired registration token",
        valid: false
      });
    }
    
    // Check team availability using new structure or legacy
    let teamInfo;
    const team = await Team.findOne({ 
      coachId: coach._id,
      isActive: true
    }).sort({ createdAt: 1 });
    
    if (team) {
      // Use new Team structure
      const availability = await checkTeamAvailability(team._id);
      teamInfo = {
        currentMembers: availability.currentSeats,
        maxMembers: availability.maxSeats,
        isFull: !availability.available
      };
    } else {
      // Fallback to legacy structure
      const teamMembersCount = await User.countDocuments({ 
        coachId: coach._id,
        role: 'user'
      });
      teamInfo = {
        currentMembers: teamMembersCount,
        maxMembers: 15,
        isFull: teamMembersCount >= 15
      };
    }
    
    res.json({
      success: true,
      valid: true,
      coach: {
        username: coach.username,
        email: coach.email
      },
      teamInfo: teamInfo
    });
    
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });
    
    const user = await User.findOne({ email });
    console.log('User found:', { exists: !!user, userId: user?._id, role: user?.role });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log('Comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    console.log('Login successful for user:', user.username);
    res.json({ accessToken, refreshToken, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Refresh Token
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid refresh token" });

      const accessToken = generateAccessToken(decoded.id);
      res.json({ accessToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Logout
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(400).json({ message: "Invalid request" });

    user.refreshToken = null;
    await user.save();

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "10m" });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Normally: send email, abhi ke liye response me bhej dete hain
    res.json({ message: "Password reset token generated", resetToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
