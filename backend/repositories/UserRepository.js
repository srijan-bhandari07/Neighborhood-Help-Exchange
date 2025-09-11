// repositories/UserRepository.js
const BaseRepository = require('../patterns/BaseRepository');
const bcrypt = require('bcryptjs');

class UserRepository extends BaseRepository {
  constructor() {
    super('User');
  }

  async create(userData) {
    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const user = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      studentId: userData.studentId
    };
    
    return await super.create(user);
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async findByUsername(username) {
    return await this.findOne({ username });
  }

  async findByStudentId(studentId) {
    return await this.findOne({ studentId });
  }
}

module.exports = UserRepository;