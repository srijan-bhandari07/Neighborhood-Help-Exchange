const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead
} = require('../controllers/messageController');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', authMiddleware, getConversations);

// @route   GET /api/messages/conversations/:conversationId
// @desc    Get a specific conversation with messages
// @access  Private
router.get('/conversations/:conversationId', authMiddleware, getConversation);

// @route   POST /api/messages/conversations/:conversationId/messages
// @desc    Send a message in a conversation
// @access  Private
router.post('/conversations/:conversationId/messages', authMiddleware, [
  body('content').trim().isLength({ min: 1 }).withMessage('Message content is required')
], sendMessage);

// @route   PUT /api/messages/conversations/:conversationId/read
// @desc    Mark messages as read in a conversation
// @access  Private
router.put('/conversations/:conversationId/read', authMiddleware, markAsRead);

module.exports = router;