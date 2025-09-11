// repositories/NotificationRepository.js
const BaseRepository = require('../patterns/BaseRepository');

class NotificationRepository extends BaseRepository {
  constructor() {
    super('Notification');
  }

  async getUserNotifications(userId, limit = 20, page = 1) {
    try {
      const notifications = await this.model.find({ recipient: userId })
        .populate('sender', 'username')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

      const total = await this.model.countDocuments({ recipient: userId });

      return {
        notifications,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      };
    } catch (error) {
      throw new Error(`Error getting user notifications: ${error.message}`);
    }
  }

  async getUnreadCount(userId) {
    try {
      return await this.model.countDocuments({ recipient: userId, read: false });
    } catch (error) {
      throw new Error(`Error getting unread count: ${error.message}`);
    }
  }

  async markAsRead(notificationId) {
    try {
      return await this.model.findByIdAndUpdate(
        notificationId,
        {
          read: true,
          readAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  async markAllAsRead(userId) {
    try {
      return await this.model.updateMany(
        { recipient: userId, read: false },
        { read: true, readAt: new Date() }
      );
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }
}

module.exports = NotificationRepository;