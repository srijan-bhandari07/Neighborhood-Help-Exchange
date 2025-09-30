/**
 * HelpPost Controller
 * 
 * This controller demonstrates both traditional object creation and the new Builder pattern
 * for creating HelpPost objects. The Builder pattern provides a more readable and flexible
 * approach to constructing complex objects.
 * 
 * Builder Pattern Usage Examples:
 * 
 * // Simple HelpPost creation
 * const helpPost = new HelpPostBuilder()
 *   .setTitle("Need help with groceries")
 *   .setDescription("Looking for someone to help carry groceries")
 *   .setCategory("Shopping")
 *   .setLocation("Campus Store")
 *   .setNeededBy(new Date("2024-01-15"))
 *   .setAuthor(userId)
 *   .build();
 * 
 * // HelpPost with helpers
 * const helpPostWithHelpers = new HelpPostBuilder()
 *   .setTitle("Study group needed")
 *   .setDescription("Looking for study partners for final exams")
 *   .setCategory("Study Help")
 *   .setLocation("Library")
 *   .setNeededBy(new Date("2024-01-20"))
 *   .setAuthor(userId)
 *   .addHelper({ user: helper1Id, message: "I can help with math!" })
 *   .addHelper({ user: helper2Id, message: "Count me in for physics" })
 *   .setStatus("in-progress")
 *   .build();
 */

const { validationResult } = require('express-validator');
const HelpPostRepository = require('../repositories/HelpPostRepository');
const ConversationRepository = require('../repositories/ConversationRepository');
const { NotificationSubject, HelpPostNotificationObserver } = require('../patterns/NotificationObserver');
const HelpPostBuilder = require('../patterns/HelpPostBuilder');

// Create notification subject
const notificationSubject = new NotificationSubject();
const helpPostObserver = new HelpPostNotificationObserver();
notificationSubject.addObserver(helpPostObserver);

// Create Help Post
const createHelpPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, location, neededBy } = req.body;
    const helpPostRepository = new HelpPostRepository();

    // Option 1: Direct object creation (existing approach)
    // const helpPost = await helpPostRepository.create({
    //   title,
    //   description,
    //   category,
    //   location,
    //   neededBy,
    //   author: req.user._id
    // });

    // Option 2: Builder pattern approach (new fluent interface)
    const helpPostData = new HelpPostBuilder()
      .setTitle(title)
      .setDescription(description)
      .setCategory(category)
      .setLocation(location)
      .setNeededBy(neededBy)
      .setAuthor(req.user._id)
      .build();

    const helpPost = await helpPostRepository.create(helpPostData);
    const io = req.app.get('io');
    if (io) {
      const populatedPost = await helpPostRepository.findByIdAndPopulate(helpPost._id);
      io.emit('new_help_post', populatedPost);
    }

    await helpPost.populate('author', 'username email studentId');

    // Notify observers
    notificationSubject.notifyObservers({
      helpPost,
      eventType: 'created'
    });

    res.status(201).json(helpPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Help Posts
const getAllHelpPosts = async (req, res) => {
  try {
    const { category, status, page = 1, limit = 10 } = req.query;
    const helpPostRepository = new HelpPostRepository();

    let filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const result = await helpPostRepository.getHelpPostsWithFilters(filter, page, limit);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get User's Help Posts
const getUserHelpPosts = async (req, res) => {
  try {
    const helpPostRepository = new HelpPostRepository();
    const helpPosts = await helpPostRepository.getUserHelpPosts(req.user._id);

    res.json(helpPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Offer Help
const offerHelp = async (req, res) => {
  try {
    const { id } = req.params;
    const { message = '' } = req.body;
    const helpPostRepository = new HelpPostRepository();

    const helpPost = await helpPostRepository.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is trying to help their own post
    if (helpPost.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot offer help on your own post' });
    }

    // Check if user has already offered help
    const alreadyHelping = helpPost.helpers.find(
      helper => helper.user.toString() === req.user._id.toString()
    );

    if (alreadyHelping) {
      return res.status(400).json({ message: 'You have already offered help for this post' });
    }

    // Add helper using repository
    await helpPostRepository.addHelper(id, {
      user: req.user._id,
      message,
      offeredAt: new Date(),
      status: 'pending'
    });

    if (req.app.get('notificationService')) {
      const notificationService = req.app.get('notificationService');
      notificationService.notifyHelpOffered(helpPost, req.user);
    }

    const updatedPost = await helpPostRepository.findByIdAndPopulate(id);

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept Help Offer
// Accept Help Offer
const acceptHelpOffer = async (req, res) => {
  try {
    const { id, helperId } = req.params;
    const helpPostRepository = new HelpPostRepository();
    const conversationRepository = new ConversationRepository();

    const helpPost = await helpPostRepository.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is the author
    if (helpPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept help offers' });
    }

    // Find the helper
    const helper = helpPost.helpers.id(helperId);
    if (!helper) {
      return res.status(404).json({ message: 'Helper not found' });
    }

    // Update helper status and post status
    await helpPostRepository.updateHelperStatus(id, helperId, 'accepted');

    // Only set to in-progress if it's not already completed
    if (helpPost.status !== 'completed') {
      await helpPostRepository.update(id, { status: 'in-progress' });
    }

    // Create a conversation between the author and the helper
    try {
      await conversationRepository.findOrCreateConversation(
        helpPost._id,
        [helpPost.author, helper.user]
      );
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Don't fail the whole request if conversation creation fails
    }

    const updatedPost = await helpPostRepository.findByIdAndPopulate(id);

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject Help Offer
const rejectHelpOffer = async (req, res) => {
  try {
    const { id, helperId } = req.params;
    const helpPostRepository = new HelpPostRepository();

    const helpPost = await helpPostRepository.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is the author
    if (helpPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject help offers' });
    }

    // Find and update the helper status
    await helpPostRepository.updateHelperStatus(id, helperId, 'rejected');

    const updatedPost = await helpPostRepository.findByIdAndPopulate(id);

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Help Post Status
const updateHelpPostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const helpPostRepository = new HelpPostRepository();

    const helpPost = await helpPostRepository.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is the author
    if (helpPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Additional validation
    if (status === 'completed' && !helpPost.helpers.some(h => h.status === 'accepted')) {
      return res.status(400).json({ message: 'Cannot complete post without an accepted helper' });
    }

    if (status === 'in-progress' && !helpPost.helpers.some(h => h.status === 'accepted')) {
      return res.status(400).json({ message: 'Cannot set to in-progress without accepting a helper' });
    }

    // Update status
    const updatedPost = await helpPostRepository.update(id, { status });

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Help Post
const updateHelpPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, category, location, neededBy } = req.body;
    const helpPostRepository = new HelpPostRepository();

    const helpPost = await helpPostRepository.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is the author
    if (helpPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Update the post
    const updatedPost = await helpPostRepository.update(id, {
      title,
      description,
      category,
      location,
      neededBy
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('updated_help_post', updatedPost);
    }

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Help Post
const deleteHelpPost = async (req, res) => {
  try {
    const { id } = req.params;
    const helpPostRepository = new HelpPostRepository();

    const helpPost = await helpPostRepository.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is the author
    if (helpPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await helpPostRepository.delete(id);
    const io = req.app.get('io');
    if (io) {
      io.emit('deleted_help_post', req.params.id);
    }
    res.json({ message: 'Help post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createHelpPost,
  getAllHelpPosts,
  getUserHelpPosts,
  offerHelp,
  acceptHelpOffer,
  rejectHelpOffer,
  updateHelpPostStatus,
  updateHelpPost,
  deleteHelpPost
};