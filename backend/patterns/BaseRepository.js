const ModelFactory = require('../patterns/ModelFactory');

class BaseRepository {
  constructor(modelType) {
    this.model = ModelFactory.getModel(modelType);
  }

  async create(data) {
    const modelInstance = ModelFactory.createModel(this.model.modelName, data);
    return await modelInstance.save();
  }

  async findById(id) {
    return await this.model.findById(id).exec();
  }

  async findOne(query) {
    return await this.model.findOne(query).exec();
  }

  // Return the query object instead of executing it immediately
  find(query = {}, options = {}) {
    return this.model.find(query, null, options);
  }

  async update(id, data) {
    return await this.model.findByIdAndUpdate(id, data, { 
      new: true, 
      runValidators: true 
    }).exec();
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id).exec();
  }

  async count(query = {}) {
    return await this.model.countDocuments(query).exec();
  }

  async updateMany(query, update) {
    return await this.model.updateMany(query, update).exec();
  }

  async deleteMany(query) {
    return await this.model.deleteMany(query).exec();
  }
}

module.exports = BaseRepository;