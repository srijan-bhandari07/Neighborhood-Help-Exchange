const { validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'username email studentId')
      .populate('helpPost', 'title')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific conversation with messages
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    })
      .populate('participants', 'username email studentId')
      .populate('helpPost', 'title');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });

    res.json({
      conversation,
      messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message in a conversation
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId } = req.params;
    const { content } = req.body;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Create new message
    const message = new Message({
      conversation: conversationId,
      sender: req.user._id,
      content
    });

    await message.save();

    // Update conversation's last message and activity
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Populate sender info before sending response
    await message.populate('sender', 'username');

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages as read in a conversation
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Mark all messages from other participants as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        read: false
      },
      { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead
};