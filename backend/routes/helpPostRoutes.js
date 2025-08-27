const express = require('express');
const { body } = require('express-validator');
const {
  createHelpPost,
  getAllHelpPosts,
  getUserHelpPosts,
  offerHelp,
  acceptHelpOffer,
  rejectHelpOffer,
  updateHelpPostStatus,
  deleteHelpPost,
  updateHelpPost // Add this if you need it
} = require('../controllers/helpPostController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/help
// @desc    Create a help post
// @access  Private
router.post('/', authMiddleware, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('category').isIn(['Shopping', 'Transport', 'Study Help', 'Food Delivery', 'Ride Share', 'Book Exchange', 'Project Help', 'Other']).withMessage('Invalid category'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('neededBy').isISO8601().withMessage('Valid needed by date is required')
], createHelpPost);

// @route   GET /api/help
// @desc    Get all help posts
// @access  Private
router.get('/', authMiddleware, getAllHelpPosts);

// @route   GET /api/help/my-posts
// @desc    Get user's help posts
// @access  Private
router.get('/my-posts', authMiddleware, getUserHelpPosts);

// @route   POST /api/help/:id/offer-help
// @desc    Offer help on a post
// @access  Private
router.post('/:id/offer-help', authMiddleware, offerHelp);

// @route   PUT /api/help/:id/helpers/:helperId/accept
// @desc    Accept a help offer
// @access  Private
router.put('/:id/helpers/:helperId/accept', authMiddleware, acceptHelpOffer);

// @route   PUT /api/help/:id/helpers/:helperId/reject
// @desc    Reject a help offer
// @access  Private
router.put('/:id/helpers/:helperId/reject', authMiddleware, rejectHelpOffer);

// @route   PUT /api/help/:id/status
// @desc    Update help post status
// @access  Private
router.put('/:id/status', authMiddleware, [
  body('status').isIn(['open', 'in-progress', 'completed']).withMessage('Invalid status')
], updateHelpPostStatus);

// @route   PUT /api/help/:id
// @desc    Update help post
// @access  Private
router.put('/:id', authMiddleware, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('category').isIn(['Shopping', 'Transport', 'Study Help', 'Food Delivery', 'Ride Share', 'Book Exchange', 'Project Help', 'Other']).withMessage('Invalid category'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('neededBy').isISO8601().withMessage('Valid needed by date is required')
], updateHelpPostStatus); // or create a separate updateHelpPost function

// @route   DELETE /api/help/:id
// @desc    Delete help post
// @access  Private
router.delete('/:id', authMiddleware, deleteHelpPost);

module.exports = router;