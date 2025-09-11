// repositories/NotificationRepository.js
const BaseRepository = require('../patterns/BaseRepository');

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  async getUserNotifications(userId, limit = 20, page = 1, filters = {}) {
    try {
      const query = { recipient: userId, ...filters };
      
      const notifications = await this.model.find(query)
        .populate('sender', 'username')
        .populate('recipient', 'username')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

      const total = await this.model.countDocuments(query);

      return {
        notifications,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error getting user notifications: ${error.message}`);
    }
  }

  async getUnreadCount(userId) {
    try {
      return await this.model.countDocuments({ 
        recipient: userId, 
        read: false 
      });
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
      ).populate('sender', 'username');
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  async markAllAsRead(userId) {
    try {
      return await this.model.updateMany(
        { recipient: userId, read: false },
        { 
          read: true, 
          readAt: new Date() 
        }
      );
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  async createNotification(notificationData) {
    try {
      const notification = await this.create(notificationData);
      return await this.model.findById(notification._id)
        .populate('sender', 'username')
        .populate('recipient', 'username')
        .exec();
    } catch (error) {
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  async getNotificationStats(userId) {
    try {
      const total = await this.model.countDocuments({ recipient: userId });
      const unread = await this.model.countDocuments({ 
        recipient: userId, 
        read: false 
      });
      const read = total - unread;

      return {
        total,
        unread,
        read
      };
    } catch (error) {
      throw new Error(`Error getting notification stats: ${error.message}`);
    }
  }

  async getNotificationsByDateRange(userId, startDate, endDate) {
    try {
      return await this.model.find({
        recipient: userId,
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .exec();
    } catch (error) {
      throw new Error(`Error getting notifications by date range: ${error.message}`);
    }
  }
}

module.exports = NotificationRepository;