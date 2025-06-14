const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info and token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err.message, err.stack);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info and token
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// Get all users (admin only)
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password'); // Exclude passwords
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err.message, err.stack);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// Create new user (admin only)
router.post('/users', protect, admin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || 'representative'
    });

    await user.save();

    // Return user info without password
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Create user error:', err.message, err.stack);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// Update user (admin only)
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username or email is already taken by another user
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ email }, { username }] }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already taken by another user' });
    }

    // Update user fields
    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    
    // Only update password if provided
    if (password && password.trim()) {
      user.password = password;
    }

    await user.save();

    // Return updated user info without password
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Update user error:', err.message, err.stack);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// Delete user (admin only)
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message, err.stack);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

module.exports = router;
