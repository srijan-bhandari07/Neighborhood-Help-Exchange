const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Check if token starts with 'Bearer '
    let token;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    } else {
      token = authHeader; // Use token as is if no Bearer prefix
    }

    // Check if token exists and is not empty
    if (!token || token.trim() === '') {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Clean the token (remove any extra whitespace or newlines)
    token = token.trim();

    // Verify token format (basic check for JWT structure)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Find user by ID from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }

    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ message: 'Token not active' });
    }
    
    // Generic server error
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

module.exports = authMiddleware;