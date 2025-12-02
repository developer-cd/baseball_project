import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Helper: generate tokens
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "24h" }); // Changed from 15m to 24h
};
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
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
    
    // Check if team is full (max 15 members)
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
    
    // Create new user with coachId
    const newUser = new User({
      username,
      email,
      password, // Will be hashed by pre-save middleware
      role: 'user',
      coachId: coach._id
    });
    
    await newUser.save();
    
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
    
    // Check if team is full
    const teamMembersCount = await User.countDocuments({ 
      coachId: coach._id,
      role: 'user'
    });
    
    const isTeamFull = teamMembersCount >= 15;
    
    res.json({
      success: true,
      valid: true,
      coach: {
        username: coach.username,
        email: coach.email
      },
      teamInfo: {
        currentMembers: teamMembersCount,
        maxMembers: 15,
        isFull: isTeamFull
      }
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
