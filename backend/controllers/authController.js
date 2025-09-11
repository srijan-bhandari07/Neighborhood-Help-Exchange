// controllers/authController.js
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { AuthContext, LocalAuthStrategy, JWTStrategy } = require('../patterns/AuthStrategy');
const UserRepository = require('../repositories/UserRepository');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register User
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, studentId } = req.body;
    const userRepository = new UserRepository();

    // Check if user exists
    const existingUser = await userRepository.findOne({
      $or: [{ email }, { username }, { studentId }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email, username, or student ID already exists' });
    }

    // Create user using repository
    const user = await userRepository.create({
      username,
      email,
      password,
      studentId
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const authContext = new AuthContext(new LocalAuthStrategy());

    const user = await authContext.executeAuth({ email, password });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ message: error.message });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const userRepository = new UserRepository();
    const user = await userRepository.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};