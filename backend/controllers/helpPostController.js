const { validationResult } = require('express-validator');
const HelpPost = require('../models/HelpPost');

// Create Help Post
const createHelpPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, location, neededBy } = req.body;

    const helpPost = new HelpPost({
      title,
      description,
      category,
      location,
      neededBy,
      author: req.user._id
    });

    await helpPost.save();
    await helpPost.populate('author', 'username email studentId');

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
    
    let filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const helpPosts = await HelpPost.find(filter)
      .populate('author', 'username email studentId')
      .populate('helpers.user', 'username email studentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HelpPost.countDocuments(filter);

    res.json({
      helpPosts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get User's Help Posts
const getUserHelpPosts = async (req, res) => {
  try {
    const helpPosts = await HelpPost.find({ author: req.user._id })
      .populate('author', 'username email studentId')
      .populate('helpers.user', 'username email studentId')
      .sort({ createdAt: -1 });

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

    const helpPost = await HelpPost.findById(id);
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

    // Add helper
    helpPost.helpers.push({
      user: req.user._id,
      message,
      offeredAt: new Date(),
      status: 'pending'
    });

    await helpPost.save();
    await helpPost.populate('author', 'username email studentId');
    await helpPost.populate('helpers.user', 'username email studentId');

    res.json(helpPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept Help Offer
const acceptHelpOffer = async (req, res) => {
  try {
    console.log('User making request:', req.user); // Debug log
    console.log('Params:', req.params); // Debug log

    const { id, helperId } = req.params;

    const helpPost = await HelpPost.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is the author
    if (helpPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept help offers' });
    }

    // Find and update the helper 
    const helper = helpPost.helpers.id(helperId);
    if (!helper) {
      return res.status(404).json({ message: 'Helper not found' });
    }

    helper.status = 'accepted';
    helpPost.status = 'in-progress';
    await helpPost.save();

    await helpPost.populate('author', 'username email studentId');
    await helpPost.populate('helpers.user', 'username email studentId');

    res.json(helpPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject Help Offer
const rejectHelpOffer = async (req, res) => {
  try {
    const { id, helperId } = req.params;

    const helpPost = await HelpPost.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is the author
    if (helpPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject help offers' });
    }

    // Find and update the helper status
    const helper = helpPost.helpers.id(helperId);
    if (!helper) {
      return res.status(404).json({ message: 'Helper not found' });
    }

    helper.status = 'rejected';
    await helpPost.save();

    await helpPost.populate('author', 'username email studentId');
    await helpPost.populate('helpers.user', 'username email studentId');

    res.json(helpPost);
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

    const helpPost = await HelpPost.findById(id);
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

    helpPost.status = status;
    await helpPost.save();
    await helpPost.populate('author', 'username email studentId');
    await helpPost.populate('helpers.user', 'username email studentId');

    res.json(helpPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Help Post
const deleteHelpPost = async (req, res) => {
  try {
    const { id } = req.params;

    const helpPost = await HelpPost.findById(id);
    if (!helpPost) {
      return res.status(404).json({ message: 'Help post not found' });
    }

    // Check if user is the author
    if (helpPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await HelpPost.findByIdAndDelete(id);
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
  deleteHelpPost
};