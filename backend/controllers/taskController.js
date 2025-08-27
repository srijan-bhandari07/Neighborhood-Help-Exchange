const Task = require('../models/Task');

// GET /tasks
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /tasks
const addTask = async (req, res) => {
  const { title, description, deadline } = req.body;
  try {
    const task = await Task.create({
      userId: req.user.id,
      title,
      description,
      deadline,
    });
    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /tasks/:id
const updateTask = async (req, res) => {
  const { title, description, completed, deadline } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;
    if (deadline !== undefined) task.deadline = deadline;

    const updatedTask = await task.save();
    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Keep .remove() to match your existing tests; in newer Mongoose you can use:
    // await task.deleteOne();
    await task.remove();

    return res.json({ message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, addTask, updateTask, deleteTask };
