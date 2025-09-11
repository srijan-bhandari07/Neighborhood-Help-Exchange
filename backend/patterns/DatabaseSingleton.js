const mongoose = require('mongoose');

class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    
    this.connection = null;
    Database.instance = this;
  }

  async connect() {
    if (this.connection) {
      return this.connection;
    }

    try {
      this.connection = await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://localhost:27017/community-help', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );
      
      console.log('MongoDB connected');
      return this.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      console.log('MongoDB disconnected');
    }
  }
}

module.exports = Database;