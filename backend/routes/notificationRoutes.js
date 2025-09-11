// routes/notificationRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const NotificationController = require('../controllers/notificationController');

const router = express.Router();
const notificationController = new NotificationController();

// @route   GET /api/notifications
// @desc    Get user notifications with pagination
// @access  Private
router.get('/', authMiddleware, notificationController.getUserNotifications.bind(notificationController));

// @route   GET /api/notifications/unread/count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread/count', authMiddleware, notificationController.getUnreadCount.bind(notificationController));

// @route   GET /api/notifications/recent
// @desc    Get recent notifications
// @access  Private
router.get('/recent', authMiddleware, notificationController.getRecentNotifications.bind(notificationController));

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const notificationRepository = new NotificationRepository();
    const stats = await notificationRepository.getNotificationStats(req.user._id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/notifications/type/:type
// @desc    Get notifications by type
// @access  Private
router.get('/type/:type', authMiddleware, notificationController.getNotificationsByType.bind(notificationController));

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authMiddleware, notificationController.markAsRead.bind(notificationController));

// @route   PUT /api/notifications/read/all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read/all', authMiddleware, notificationController.markAllAsRead.bind(notificationController));

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', authMiddleware, notificationController.deleteNotification.bind(notificationController));

// @route   DELETE /api/notifications
// @desc    Clear all notifications
// @access  Private
router.delete('/', authMiddleware, notificationController.clearAllNotifications.bind(notificationController));

module.exports = router;