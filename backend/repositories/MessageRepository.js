const BaseRepository = require('../patterns/BaseRepository');

class MessageRepository extends BaseRepository {
  constructor() {
    super('Message');
  }

  async updateMany(query, update) {
    return await this.model.updateMany(query, update);
  }

  async getConversationMessages(conversationId) {
    try {
      return await this.model.find({ conversation: conversationId })
        .populate('sender', 'username')
        .sort({ createdAt: 1 })
        .exec(); // Add .exec() to execute the query
    } catch (error) {
      throw new Error(`Error getting conversation messages: ${error.message}`);
    }
  }

  // Add method to create a message with proper population
  async createMessage(data) {
    try {
      const message = await this.create(data);
      return await this.model.findById(message._id)
        .populate('sender', 'username')
        .exec();
    } catch (error) {
      throw new Error(`Error creating message: ${error.message}`);
    }
  }

  // Add method to mark messages as read
  async markMessagesAsRead(conversationId, userId) {
    try {
      return await this.model.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },
          read: false
        },
        { $set: { read: true } }
      );
    } catch (error) {
      throw new Error(`Error marking messages as read: ${error.message}`);
    }
  }

  // Add method to get unread message count
  async getUnreadCount(conversationId, userId) {
    try {
      return await this.model.countDocuments({
        conversation: conversationId,
        sender: { $ne: userId },
        read: false
      });
    } catch (error) {
      throw new Error(`Error getting unread count: ${error.message}`);
    }
  }
}

module.exports = MessageRepository;