// routes/notificationRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const NotificationRepository = require('../repositories/NotificationRepository');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notificationRepository = new NotificationRepository();
    
    const result = await notificationRepository.getUserNotifications(
      req.user._id, 
      parseInt(limit), 
      parseInt(page)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/unread/count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const notificationRepository = new NotificationRepository();
    const count = await notificationRepository.getUnreadCount(req.user._id);
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notificationRepository = new NotificationRepository();
    const notification = await notificationRepository.markAsRead(
      req.params.id, 
      req.user._id
    );
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/read/all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read/all', authMiddleware, async (req, res) => {
  try {
    const notificationRepository = new NotificationRepository();
    const result = await notificationRepository.markAllAsRead(req.user._id);
    
    res.json({ message: 'All notifications marked as read', updatedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;