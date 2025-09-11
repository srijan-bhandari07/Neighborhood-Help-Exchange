// repositories/TaskRepository.js
const BaseRepository = require('../patterns/BaseRepository');

class TaskRepository extends BaseRepository {
  constructor() {
    super('Task');
  }

  async getUserTasks(userId) {
    return await this.find({ userId });
  }

  async updateTaskStatus(taskId, completed) {
    return await this.update(taskId, { completed });
  }
}

module.exports = TaskRepository;