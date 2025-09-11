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
  update(data) {
    const { message, io, conversation } = data;
    
    // Notify all participants in the conversation except the sender
    if (io && conversation && conversation.participants) {
      conversation.participants.forEach(participant => {
        if (participant._id.toString() !== message.sender._id.toString()) {
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
      });
    }
    
    console.log(`New message notification: ${message.content}`);
  }
}

class HelpPostNotificationObserver extends NotificationObserver {
  update(data) {
    const { helpPost, eventType, io, user } = data;
    
    if (io && helpPost) {
      let notificationMessage = '';
      let notificationType = '';
      
      switch (eventType) {
        case 'created':
          notificationMessage = `New help request: ${helpPost.title}`;
          notificationType = 'new_help_post';
          break;
        case 'updated':
          notificationMessage = `Help request updated: ${helpPost.title}`;
          notificationType = 'help_post_updated';
          break;
        case 'help_offered':
          notificationMessage = `Someone offered help on your post: ${helpPost.title}`;
          notificationType = 'help_offered';
          // Notify the post author
          if (helpPost.author && helpPost.author._id) {
            io.to(helpPost.author._id.toString()).emit('help_post_notification', {
              type: notificationType,
              message: notificationMessage,
              helpPost: {
                _id: helpPost._id,
                title: helpPost.title,
                status: helpPost.status
              },
              timestamp: new Date()
            });
          }
          break;
        case 'help_accepted':
          notificationMessage = `Your help offer was accepted: ${helpPost.title}`;
          notificationType = 'help_accepted';
          break;
        case 'help_rejected':
          notificationMessage = `Your help offer was rejected: ${helpPost.title}`;
          notificationType = 'help_rejected';
          break;
        case 'status_changed':
          notificationMessage = `Help request status changed: ${helpPost.title} is now ${helpPost.status}`;
          notificationType = 'status_changed';
          break;
        default:
          notificationMessage = `Help post ${eventType}: ${helpPost.title}`;
          notificationType = 'help_post_general';
      }
      
      console.log(`Help post notification: ${notificationMessage}`);
    }
  }
}

class SystemNotificationObserver extends NotificationObserver {
  update(data) {
    const { message, type, io, userId } = data;
    
    if (io && userId) {
      io.to(userId).emit('system_notification', {
        type: type || 'info',
        message: message,
        timestamp: new Date()
      });
    }
    
    console.log(`System notification: ${message}`);
  }
}

module.exports = {
  NotificationSubject,
  MessageNotificationObserver,
  HelpPostNotificationObserver,
  SystemNotificationObserver
};