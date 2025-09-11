const express = require('express');
const mongoose = require('mongoose');
const http = require('http'); // Add this import
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const helpPostRoutes = require('./routes/helpPostRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Import socket setup
const setupMessagingSocket = require('./socket/messaging');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/community-help', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/help', helpPostRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Setup messaging socket
setupMessagingSocket(io);

const PORT = process.env.PORT || 5001;

// Use server instead of app for listening
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});