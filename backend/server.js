const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const helpPostRoutes = require('./routes/helpPostRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const taskRoutes = require('./routes/taskRoutes');


// Import socket setup
const setupMessagingSocket = require('./socket/messaging');

const notificationRoutes = require('./routes/notificationRoutes'); // New route

// Import services
const NotificationService = require('./services/NotificationService');

// Import Database Singleton
const Database = require('./patterns/DatabaseSingleton');

class Server {
  constructor() {
    this.app = express();
    this.server = null;
    this.io = null;
    this.notificationService = null;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupDatabase();
    this.setupSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/help', helpPostRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/messages', messageRoutes);
    this.app.use('api/task', taskRoutes);
    this.app.use('/api/notifications', notificationRoutes);
    
   
  }

  setupDatabase() {
    const database = new Database();
    database.connect();
  }

  setupSocket() {
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.notificationService = new NotificationService(this.io);
    
    // Setup messaging socket with notification service
    require('./socket/messaging')(this.io, this.notificationService);
    
    console.log('Notification service initialized with', this.notificationService.getObserverCount(), 'observers');

    setupMessagingSocket(this.io);
    
  }

  

  start(port = process.env.PORT || 5001) {
    this.server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    
    return this.server;
  }

  getApp() {
    return this.app;
  }

  getIO() {
    return this.io;
  }
}

// Create and start the server
const server = new Server();
server.start();

module.exports = server;