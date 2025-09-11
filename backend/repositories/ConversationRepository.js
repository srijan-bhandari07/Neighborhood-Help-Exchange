const BaseRepository = require('../patterns/BaseRepository');
const ModelFactory = require('../patterns/ModelFactory');

class ConversationRepository extends BaseRepository {
  constructor() {
    super('Conversation');
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of conversations
   */
  async getUserConversations(userId) {
    try {
      return await this.model.find({ participants: userId })
        .populate('participants', 'username email studentId')
        .populate({
          path: 'helpPost',
          model: ModelFactory.getModel('helpposts'), // Explicitly specify the model
          select: 'title'
        })
        .populate('lastMessage')
        .sort({ lastActivity: -1 })
        .exec();
    } catch (error) {
      throw new Error(`Error getting user conversations: ${error.message}`);
    }
  }

  /**
   * Find a conversation by ID and ensure user is a participant
   * @param {string} conversationId - The conversation ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Conversation object
   */
  async findConversation(conversationId, userId) {
    try {
      return await this.model.findOne({
        _id: conversationId,
        participants: userId
      })
        .populate('participants', 'username email studentId')
        .populate({
          path: 'helpPost',
          model: ModelFactory.getModel('helpposts'), // Explicitly specify the model
          select: 'title'
        })
        .exec();
    } catch (error) {
      throw new Error(`Error finding conversation: ${error.message}`);
    }
  }

  /**
   * Create a new conversation between participants for a help post
   * @param {Object} conversationData - Conversation data
   * @param {Array} conversationData.participants - Array of participant IDs
   * @param {string} conversationData.helpPost - Help post ID
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(conversationData) {
    try {
      const conversation = ModelFactory.createModel('Conversation', conversationData);
      return await conversation.save();
    } catch (error) {
      // Handle duplicate key error (conversation already exists)
      if (error.code === 11000) {
        // Find the existing conversation
        return await this.model.findOne({
          participants: { $all: conversationData.participants },
          helpPost: conversationData.helpPost
        });
      }
      throw new Error(`Error creating conversation: ${error.message}`);
    }
  }

  /**
   * Update conversation's last message and activity timestamp
   * @param {string} conversationId - The conversation ID
   * @param {string} messageId - The message ID
   * @returns {Promise<Object>} Updated conversation
   */
  async updateLastMessage(conversationId, messageId) {
    try {
      return await this.model.findByIdAndUpdate(
        conversationId,
        {
          lastMessage: messageId,
          lastActivity: new Date()
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating conversation last message: ${error.message}`);
    }
  }
/**
   * Update conversation's last message and activity timestamp
   * @param {string} conversationId - The conversation ID
   * @param {string} messageId - The message ID
   * @returns {Promise<Object>} Updated conversation
   */
async updateLastMessage(conversationId, messageId) {
    try {
      return await this.model.findByIdAndUpdate(
        conversationId,
        {
          lastMessage: messageId,
          lastActivity: new Date()
        },
        { new: true }
      ).exec();
    } catch (error) {
      throw new Error(`Error updating conversation last message: ${error.message}`);
    }
  }
  /**
   * Find or create a conversation for a help post and participants
   * @param {string} helpPostId - The help post ID
   * @param {Array} participants - Array of participant IDs
   * @returns {Promise<Object>} Conversation object
   */
  async findOrCreateConversation(helpPostId, participants) {
    try {
      // Try to find existing conversation
      let conversation = await this.model.findOne({
        helpPost: helpPostId,
        participants: { $all: participants, $size: participants.length }
      });

      // If not found, create a new one
      if (!conversation) {
        conversation = await this.createConversation({
          participants,
          helpPost: helpPostId
        });
      }

      return conversation;
    } catch (error) {
      throw new Error(`Error finding or creating conversation: ${error.message}`);
    }
  }

  /**
   * Get conversations for a specific help post
   * @param {string} helpPostId - The help post ID
   * @returns {Promise<Array>} Array of conversations
   */
  async getConversationsByHelpPost(helpPostId) {
    try {
      return await this.model.find({ helpPost: helpPostId })
        .populate('participants', 'username email studentId')
        .sort({ lastActivity: -1 });
    } catch (error) {
      throw new Error(`Error getting conversations by help post: ${error.message}`);
    }
  }

  /**
   * Check if a user is a participant in a conversation
   * @param {string} conversationId - The conversation ID
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} True if user is a participant
   */
  async isUserParticipant(conversationId, userId) {
    try {
      const conversation = await this.model.findOne({
        _id: conversationId,
        participants: userId
      });
      return !!conversation;
    } catch (error) {
      throw new Error(`Error checking user participation: ${error.message}`);
    }
  }

  /**
   * Add a participant to a conversation
   * @param {string} conversationId - The conversation ID
   * @param {string} userId - The user ID to add
   * @returns {Promise<Object>} Updated conversation
   */
  async addParticipant(conversationId, userId) {
    try {
      return await this.model.findByIdAndUpdate(
        conversationId,
        { $addToSet: { participants: userId } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error adding participant to conversation: ${error.message}`);
    }
  }

    /**
   * Find conversation by ID with optional population
   */

  async findById(id, populateFields = []) {
    try {
      let query = this.model.findById(id);
      
      // Apply population if specified
      if (populateFields.length > 0) {
        populateFields.forEach(field => {
          query = query.populate(field);
        });
      }
      
      return await query.exec();
    } catch (error) {
      throw new Error(`Error finding conversation by ID: ${error.message}`);
    }
  }

  /**
   * Find conversation by ID with full population
   */
  async findByIdAndPopulate(id) {
    try {
      return await this.model.findById(id)
        .populate('participants', 'username email studentId')
        .populate({
          path: 'helpPost',
          model: ModelFactory.getModel('helpposts'),
          select: 'title'
        })
        .populate('lastMessage')
        .exec();
    } catch (error) {
      throw new Error(`Error finding conversation by ID with populate: ${error.message}`);
    }
  }

  /**
   * Remove a participant from a conversation
   * @param {string} conversationId - The conversation ID
   * @param {string} userId - The user ID to remove
   * @returns {Promise<Object>} Updated conversation
   */
  async removeParticipant(conversationId, userId) {
    try {
      return await this.model.findByIdAndUpdate(
        conversationId,
        { $pull: { participants: userId } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error removing participant from conversation: ${error.message}`);
    }
  }

  /**
   * Delete conversations for a specific help post
   * @param {string} helpPostId - The help post ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteByHelpPost(helpPostId) {
    try {
      return await this.model.deleteMany({ helpPost: helpPostId });
    } catch (error) {
      throw new Error(`Error deleting conversations by help post: ${error.message}`);
    }
  }

  /**
   * Get conversation count for a user
   * @param {string} userId - The user ID
   * @returns {Promise<number>} Number of conversations
   */
  async getConversationCount(userId) {
    try {
      return await this.model.countDocuments({ participants: userId });
    } catch (error) {
      throw new Error(`Error getting conversation count: ${error.message}`);
    }
  }

  /**
   * Search conversations by participant name or help post title
   * @param {string} userId - The user ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of conversations
   */
  async searchConversations(userId, searchTerm) {
    try {
      return await this.model.find({ participants: userId })
        .populate({
          path: 'participants',
          select: 'username email studentId',
          match: { username: { $regex: searchTerm, $options: 'i' } }
        })
        .populate({
          path: 'helpPost',
          select: 'title',
          match: { title: { $regex: searchTerm, $options: 'i' } }
        })
        .sort({ lastActivity: -1 });
    } catch (error) {
      throw new Error(`Error searching conversations: ${error.message}`);
    }
  }
}

module.exports = ConversationRepository;