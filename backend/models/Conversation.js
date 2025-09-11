const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  helpPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'helpposts',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure each help post has only one conversation between the same participants
conversationSchema.index({ helpPost: 1, participants: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);