// controllers/taskController.js
const TaskRepository = require('../repositories/TaskRepository');

// GET /tasks
const getTasks = async (req, res) => {
  try {
    const taskRepository = new TaskRepository();
    const tasks = await taskRepository.find({ userId: req.user.id });
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /tasks
const addTask = async (req, res) => {
  const { title, description, deadline } = req.body;
  try {
    const taskRepository = new TaskRepository();
    const task = await taskRepository.create({
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
    const taskRepository = new TaskRepository();
    const task = await taskRepository.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user owns the task
    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updatedTask = await taskRepository.update(req.params.id, {
      title,
      description,
      completed,
      deadline
    });

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /tasks/:id
const deleteTask = async (req, res) => {
  try {
    const taskRepository = new TaskRepository();
    const task = await taskRepository.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user owns the task
    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await taskRepository.delete(req.params.id);
    return res.json({ message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, addTask, updateTask, deleteTask };