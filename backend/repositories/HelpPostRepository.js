const BaseRepository = require('../patterns/BaseRepository');

class HelpPostRepository extends BaseRepository {
  constructor() {
    super('HelpPost');
  }

  async getHelpPostsWithFilters(filters = {}, page = 1, limit = 10) {
    try {
      const helpPosts = await this.find(filters)
        .populate('author', 'username email studentId')
        .populate('helpers.user', 'username email studentId')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec(); // Add .exec() to execute the query

      const total = await this.model.countDocuments(filters);

      return {
        helpPosts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      };
    } catch (error) {
      throw new Error(`Error getting help posts with filters: ${error.message}`);
    }
  }

  async getUserHelpPosts(userId) {
    try {
      return await this.find({ author: userId })
        .populate('author', 'username email studentId')
        .populate('helpers.user', 'username email studentId')
        .sort({ createdAt: -1 })
        .exec(); // Add .exec() to execute the query
    } catch (error) {
      throw new Error(`Error getting user help posts: ${error.message}`);
    }
  }

  async getPostsByAuthor(userId) {
    try {
      return await this.find({ author: userId })
        .populate('author', 'username email studentId')
        .populate('helpers.user', 'username email studentId')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new Error(`Error getting posts by author: ${error.message}`);
    }
  }

  async getPostsByHelper(userId) {
    try {
      return await this.find({ 
        'helpers.user': userId 
      })
        .populate('author', 'username email studentId')
        .populate('helpers.user', 'username email studentId')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new Error(`Error getting posts by helper: ${error.message}`);
    }
  }

  async addHelper(postId, helperData) {
    try {
      const post = await this.model.findById(postId);
      if (!post) {
        throw new Error('Help post not found');
      }
      
      post.helpers.push(helperData);
      return await post.save();
    } catch (error) {
      throw new Error(`Error adding helper: ${error.message}`);
    }
  }

  async updateHelperStatus(postId, helperId, status) {
    try {
      const post = await this.model.findById(postId);
      if (!post) {
        throw new Error('Help post not found');
      }

      const helper = post.helpers.id(helperId);
      if (!helper) {
        throw new Error('Helper not found');
      }

      helper.status = status;
      return await post.save();
    } catch (error) {
      throw new Error(`Error updating helper status: ${error.message}`);
    }
  }

  async findByIdAndPopulate(id) {
    try {
      return await this.model.findById(id)
        .populate('author', 'username email studentId')
        .populate('helpers.user', 'username email studentId')
        .exec();
    } catch (error) {
      throw new Error(`Error finding post by ID with populate: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const updatedPost = await this.model.findByIdAndUpdate(id, data, { 
        new: true, 
        runValidators: true 
      });
      
      // Populate the updated post
      return await this.findByIdAndPopulate(updatedPost._id);
    } catch (error) {
      throw new Error(`Error updating help post: ${error.message}`);
    }
  }
}

module.exports = HelpPostRepository;