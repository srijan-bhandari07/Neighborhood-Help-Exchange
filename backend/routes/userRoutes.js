const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const UserRepository = require('../repositories/UserRepository');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userRepository = new UserRepository();
    const user = await userRepository.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Private
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const userRepository = new UserRepository();
    const user = await userRepository.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't return sensitive information
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      studentId: user.studentId,
      createdAt: user.createdAt
    };
    
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;