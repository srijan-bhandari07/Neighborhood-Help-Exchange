// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.type !== 'system';
    }
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: [
        'new_message',
        'help_post_created',
        'help_post_updated',
        'help_offered',
        'help_accepted',
        'help_rejected',
        'status_changed',
        'system'
      ],
      message: 'Invalid notification type'
    }
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['HelpPost', 'Conversation', 'Message', null],
      default: null
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for isUnread
notificationSchema.virtual('isUnread').get(function() {
  return !this.read;
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days
notificationSchema.index({ type: 1, recipient: 1 });
notificationSchema.index({ 'relatedEntity.entityId': 1, 'relatedEntity.entityType': 1 });

// Pre-save middleware to trim fields
notificationSchema.pre('save', function(next) {
  if (this.title) this.title = this.title.trim();
  if (this.message) this.message = this.message.trim();
  next();
});

module.exports = mongoose.model('notifications', notificationSchema);