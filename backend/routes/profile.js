const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get current user profile
router.get('/', auth, async (req, res) => {
  try {
    // req.user comes from the auth middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error.message, error.stack);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Update user's username
router.put('/username', auth, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Update username
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username: username.trim() },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Username updated successfully',
      user
    });
  } catch (error) {
    console.error('Username update error:', error.message, error.stack);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Update user's password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save(); // This will trigger the password hashing middleware
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error.message, error.stack);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

module.exports = router;
