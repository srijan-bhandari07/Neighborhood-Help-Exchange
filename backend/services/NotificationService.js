// services/NotificationService.js
const {
    NotificationSubject,
    MessageNotificationObserver,
    HelpPostNotificationObserver,
    SystemNotificationObserver
  } = require('../patterns/NotificationObserver');
  
  class NotificationService {
    constructor(io) {
      this.io = io;
      this.notificationSubject = new NotificationSubject();
      
      // Initialize observers
      this.messageObserver = new MessageNotificationObserver();
      this.helpPostObserver = new HelpPostNotificationObserver();
      this.systemObserver = new SystemNotificationObserver();
      
      // Register observers
      this.notificationSubject.addObserver(this.messageObserver);
      this.notificationSubject.addObserver(this.helpPostObserver);
      this.notificationSubject.addObserver(this.systemObserver);
    }
  
    // Message notifications
    notifyNewMessage(message, conversation) {
      this.notificationSubject.notifyObservers({
        message,
        conversation,
        io: this.io,
        type: 'new_message'
      });
    }
  
    // Help post notifications
    notifyHelpPostCreated(helpPost) {
      this.notificationSubject.notifyObservers({
        helpPost,
        eventType: 'created',
        io: this.io,
        type: 'help_post_created'
      });
    }
  
    notifyHelpPostUpdated(helpPost) {
      this.notificationSubject.notifyObservers({
        helpPost,
        eventType: 'updated',
        io: this.io,
        type: 'help_post_updated'
      });
    }
  
    notifyHelpOffered(helpPost, helperUser) {
      this.notificationSubject.notifyObservers({
        helpPost,
        helperUser,
        eventType: 'help_offered',
        io: this.io,
        type: 'help_offered'
      });
    }
  
    notifyHelpAccepted(helpPost, helperUser) {
      this.notificationSubject.notifyObservers({
        helpPost,
        helperUser,
        eventType: 'help_accepted',
        io: this.io,
        type: 'help_accepted'
      });
    }
  
    notifyHelpRejected(helpPost, helperUser) {
      this.notificationSubject.notifyObservers({
        helpPost,
        helperUser,
        eventType: 'help_rejected',
        io: this.io,
        type: 'help_rejected'
      });
    }
  
    notifyStatusChanged(helpPost, oldStatus, newStatus) {
      this.notificationSubject.notifyObservers({
        helpPost,
        oldStatus,
        newStatus,
        eventType: 'status_changed',
        io: this.io,
        type: 'status_changed'
      });
    }
  
    // System notifications
    notifyUser(userId, message, type = 'info') {
      this.notificationSubject.notifyObservers({
        userId,
        message,
        type,
        io: this.io
      });
    }
  
    // Get observer count for debugging
    getObserverCount() {
      return this.notificationSubject.getObserversCount();
    }
  }
  
  module.exports = NotificationService;