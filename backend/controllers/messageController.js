const { validationResult } = require('express-validator');
const ConversationRepository = require('../repositories/ConversationRepository');
const MessageRepository = require('../repositories/MessageRepository');

// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const conversationRepository = new ConversationRepository();
    const conversations = await conversationRepository.getUserConversations(req.user._id);

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
    const conversationRepository = new ConversationRepository();
    const messageRepository = new MessageRepository();

    const conversation = await conversationRepository.findConversation(conversationId, req.user._id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await messageRepository.getConversationMessages(conversationId);

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
    const conversationRepository = new ConversationRepository();
    const messageRepository = new MessageRepository();

    // Check if user is part of the conversation
    const conversation = await conversationRepository.findConversation(conversationId, req.user._id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Create new message using repository
    const message = await messageRepository.createMessage({
      conversation: conversationId,
      sender: req.user._id,
      content
    });

    // Update conversation's last message and activity
    await conversationRepository.updateLastMessage(conversationId, message._id);

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
    const conversationRepository = new ConversationRepository();
    const messageRepository = new MessageRepository();

    // Check if user is part of the conversation
    const conversation = await conversationRepository.findConversation(conversationId, req.user._id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Mark all messages from other participants as read
    await messageRepository.markMessagesAsRead(conversationId, req.user._id);

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