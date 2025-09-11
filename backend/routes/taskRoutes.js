// routes/taskRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getTasks, addTask, updateTask, deleteTask } = require('../controllers/taskController');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get user's tasks
// @access  Private
router.get('/', authMiddleware, getTasks);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', authMiddleware, addTask);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', authMiddleware, updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', authMiddleware, deleteTask);

module.exports = router;