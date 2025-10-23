import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/baseball_questionare', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testUserCreation() {
  try {
    console.log('Testing user creation...');
    
    // Create a test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123',
      role: 'user'
    });
    
    console.log('Before save - password:', testUser.password);
    await testUser.save();
    console.log('After save - password:', testUser.password);
    
    // Test login
    console.log('Testing login...');
    const foundUser = await User.findOne({ email: 'test@example.com' });
    console.log('Found user:', foundUser ? 'Yes' : 'No');
    console.log('User password hash:', foundUser?.password);
    
    const isMatch = await bcrypt.compare('test123', foundUser.password);
    console.log('Password match:', isMatch);
    
    // Clean up
    await User.deleteOne({ email: 'test@example.com' });
    console.log('Test user deleted');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUserCreation();
