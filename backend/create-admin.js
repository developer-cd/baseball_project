import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }
    
    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@baseball.com',
      password: 'admin123',
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@baseball.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();
