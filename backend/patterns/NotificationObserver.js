// patterns/NotificationObserver.js
class NotificationSubject {
  constructor() {
    this.observers = [];
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notifyObservers(data) {
    this.observers.forEach(observer => observer.update(data));
  }

  getObserversCount() {
    return this.observers.length;
  }
}

class NotificationObserver {
  update(data) {
    throw new Error('Update method must be implemented');
  }
}

class MessageNotificationObserver extends NotificationObserver {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  async update(data) {
    const { message, io, conversation, type } = data;
    
    if (type === 'new_message' && conversation && conversation.participants) {
      try {
        // Create notifications for all participants except the sender
        for (const participant of conversation.participants) {
          if (participant._id.toString() !== message.sender._id.toString()) {
            // Save notification to database
            await this.notificationRepository.createNotification({
              recipient: participant._id,
              sender: message.sender._id,
              type: 'new_message',
              title: 'New Message',
              message: `New message from ${message.sender.username}: ${message.content.substring(0, 50)}...`,
              relatedEntity: {
                entityType: 'Conversation',
                entityId: conversation._id
              }
            });

            // Emit real-time notification
            if (io) {
              io.to(participant._id.toString()).emit('new_message_notification', {
                message: {
                  _id: message._id,
                  content: message.content,
                  sender: {
                    _id: message.sender._id,
                    username: message.sender.username
                  },
                  conversation: message.conversation,
                  createdAt: message.createdAt
                },
                conversation: {
                  _id: conversation._id,
                  helpPost: conversation.helpPost
                }
              });
            }
          }
        }
        
        console.log(`New message notification created: ${message.content}`);
      } catch (error) {
        console.error('Error creating message notification:', error);
      }
    }
  }
}

class HelpPostNotificationObserver extends NotificationObserver {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  async update(data) {
    const { helpPost, eventType, io, helperUser, type } = data;
    
    if (type && type.startsWith('help_') && helpPost) {
      try {
        let notificationData = {};
        let recipients = [];

        switch (type) {
          case 'help_post_created':
            // Notify all users about new help post (you might want to limit this)
            recipients = []; // You'll need to implement user discovery logic
            notificationData = {
              type: 'help_post_created',
              title: 'New Help Request',
              message: `New help request: ${helpPost.title}`,
              relatedEntity: {
                entityType: 'HelpPost',
                entityId: helpPost._id
              }
            };
            break;

          case 'help_offered':
            // Notify the post author that someone offered help
            recipients = [helpPost.author._id || helpPost.author];
            notificationData = {
              type: 'help_offered',
              title: 'Help Offer Received',
              message: `${helperUser.username} offered help on your post: ${helpPost.title}`,
              relatedEntity: {
                entityType: 'HelpPost',
                entityId: helpPost._id
              }
            };
            break;

          case 'help_accepted':
            // Notify the helper that their offer was accepted
            recipients = [helperUser._id];
            notificationData = {
              type: 'help_accepted',
              title: 'Help Offer Accepted',
              message: `Your help offer was accepted for: ${helpPost.title}`,
              relatedEntity: {
                entityType: 'HelpPost',
                entityId: helpPost._id
              }
            };
            break;

          case 'help_rejected':
            // Notify the helper that their offer was rejected
            recipients = [helperUser._id];
            notificationData = {
              type: 'help_rejected',
              title: 'Help Offer Rejected',
              message: `Your help offer was rejected for: ${helpPost.title}`,
              relatedEntity: {
                entityType: 'HelpPost',
                entityId: helpPost._id
              }
            };
            break;

          case 'status_changed':
            // Notify all participants about status change
            recipients = [helpPost.author._id || helpPost.author];
            // Also notify helpers if needed
            if (helpPost.helpers && helpPost.helpers.length > 0) {
              helpPost.helpers.forEach(helper => {
                if (helper.user && helper.user._id) {
                  recipients.push(helper.user._id);
                }
              });
            }
            notificationData = {
              type: 'status_changed',
              title: 'Status Updated',
              message: `Help request status changed: ${helpPost.title} is now ${helpPost.status}`,
              relatedEntity: {
                entityType: 'HelpPost',
                entityId: helpPost._id
              }
            };
            break;
        }

        // Create notifications for all recipients
        for (const recipientId of recipients) {
          await this.notificationRepository.createNotification({
            recipient: recipientId,
            sender: helperUser ? helperUser._id : undefined,
            ...notificationData
          });

          // Emit real-time notification
          if (io) {
            io.to(recipientId.toString()).emit('help_post_notification', {
              type: notificationData.type,
              message: notificationData.message,
              helpPost: {
                _id: helpPost._id,
                title: helpPost.title,
                status: helpPost.status
              },
              timestamp: new Date()
            });
          }
        }

        console.log(`Help post notification created: ${notificationData.message}`);
      } catch (error) {
        console.error('Error creating help post notification:', error);
      }
    }
  }
}

class SystemNotificationObserver extends NotificationObserver {
  constructor(notificationRepository) {
    super();
    this.notificationRepository = notificationRepository;
  }

  async update(data) {
    const { message, type, io, userId } = data;
    
    if (userId && message) {
      try {
        // Save system notification to database
        await this.notificationRepository.createNotification({
          recipient: userId,
          type: 'system',
          title: 'System Notification',
          message: message,
          relatedEntity: null
        });

        // Emit real-time notification
        if (io) {
          io.to(userId).emit('system_notification', {
            type: type || 'info',
            message: message,
            timestamp: new Date()
          });
        }

        console.log(`System notification created: ${message}`);
      } catch (error) {
        console.error('Error creating system notification:', error);
      }
    }
  }
}

module.exports = {
  NotificationSubject,
  MessageNotificationObserver,
  HelpPostNotificationObserver,
  SystemNotificationObserver
};