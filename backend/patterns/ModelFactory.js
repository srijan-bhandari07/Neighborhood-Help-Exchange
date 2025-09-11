// patterns/ModelFactory.js
const User = require('../models/User');
const HelpPost = require('../models/HelpPost');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Task = require('../models/Task');
const Notification = require('../models/Notification')

class ModelFactory {
  static createModel(modelType, data) {
    switch (modelType) {
      case 'User':
        return new User(data);
      case 'HelpPost':
      case 'helpposts':
        return new HelpPost(data);
      case 'Conversation':
        return new Conversation(data);
      case 'Message':
        return new Message(data);
      case 'Task':
        return new Task(data);
        case 'notifications' :
        return new Notification(data);
      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }
  }

  static getModel(modelType) {
    switch (modelType) {
      case 'User':
        return User;
      case 'HelpPost':
      case 'helpposts':
        return HelpPost;
      case 'Conversation':
        return Conversation;
      case 'Message':
        return Message;
      case 'Task':
        return Task;
        case 'notifications': // Add this case
        return Notification;
      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }
  }
}

module.exports = ModelFactory;