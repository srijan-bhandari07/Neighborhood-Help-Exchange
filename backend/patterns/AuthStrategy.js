// patterns/AuthStrategy.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthStrategy {
  async authenticate(credentials) {
    throw new Error('Authenticate method must be implemented');
  }
}

class LocalAuthStrategy extends AuthStrategy {
  async authenticate(credentials) {
    const { email, password } = credentials;
    
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return user;
  }
}

class JWTStrategy extends AuthStrategy {
  async authenticate(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      throw new Error('Invalid token payload');
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

class AuthContext {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async executeAuth(credentials) {
    return await this.strategy.authenticate(credentials);
  }
}

module.exports = {
  AuthContext,
  LocalAuthStrategy,
  JWTStrategy
};