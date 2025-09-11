// controllers/NotificationController.js
const NotificationRepository = require('../repositories/NotificationRepository');

class NotificationController {
  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user._id;

      const result = await this.notificationRepository.getUserNotifications(
        userId, 
        parseInt(limit), 
        parseInt(page)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching notifications'
      });
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user._id;
      const count = await this.notificationRepository.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching unread count'
      });
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      // Verify the notification belongs to the user
      const notification = await this.notificationRepository.findById(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      if (notification.recipient.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to modify this notification'
        });
      }

      const updatedNotification = await this.notificationRepository.markAsRead(id);

      res.json({
        success: true,
        data: updatedNotification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while marking notification as read'
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user._id;
      const result = await this.notificationRepository.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
        data: { updatedCount: result.modifiedCount }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while marking all notifications as read'
      });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      // Verify the notification belongs to the user
      const notification = await this.notificationRepository.findById(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      if (notification.recipient.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to delete this notification'
        });
      }

      await this.notificationRepository.delete(id);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting notification'
      });
    }
  }

  /**
   * Clear all notifications for user
   */
  async clearAllNotifications(req, res) {
    try {
      const userId = req.user._id;
      const result = await this.notificationRepository.deleteMany({ recipient: userId });

      res.json({
        success: true,
        message: 'All notifications cleared',
        data: { deletedCount: result.deletedCount }
      });
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while clearing notifications'
      });
    }
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(req, res) {
    try {
      const { type } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user._id;

      const result = await this.notificationRepository.getUserNotifications(
        userId, 
        parseInt(limit), 
        parseInt(page),
        { type }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching notifications by type'
      });
    }
  }

  /**
   * Get recent notifications (last 10)
   */
  async getRecentNotifications(req, res) {
    try {
      const userId = req.user._id;
      const notifications = await this.notificationRepository.getUserNotifications(
        userId, 
        10, 
        1
      );

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching recent notifications'
      });
    }
  }
}

module.exports = NotificationController;