// socket/messaging.js
const MessageRepository = require('../repositories/MessageRepository');
const ConversationRepository = require('../repositories/ConversationRepository');
const SocketAdapter = require('../patterns/SocketAdapter');

const setupMessagingSocket = (io, notificationService) => {
  const socketAdapter = new SocketAdapter(io);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socketAdapter.joinRoom(socket, conversationId);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socketAdapter.leaveRoom(socket, conversationId);
      console.log(`User left conversation: ${conversationId}`);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, senderId } = data;
        const messageRepository = new MessageRepository();
        const conversationRepository = new ConversationRepository();

        // Create new message
        const message = await messageRepository.createMessage({
          conversation: conversationId,
          sender: senderId,
          content
        });

        // Update conversation's last message and activity
        const conversation = await conversationRepository.updateLastMessage(conversationId, message._id);

        // Notify about new message using NotificationService
        if (notificationService && conversation) {
          // First get the populated conversation
          const populatedConversation = await conversationRepository.findById(conversationId);
          if (populatedConversation) {
            // Then populate the participants
            await populatedConversation.populate('participants', 'username email studentId');
            notificationService.notifyNewMessage(message, populatedConversation);
          }
        }

        // Emit to all users in the conversation
        socketAdapter.emitToRoom(conversationId, 'new_message', message);

      } catch (error) {
        console.error('Error sending message:', error);
        socketAdapter.emitToSocket(socket, 'message_error', { error: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('mark_as_read', async (data) => {
      try {
        const { conversationId, userId } = data;
        const messageRepository = new MessageRepository();

        await messageRepository.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: userId },
            read: false
          },
          { $set: { read: true } }
        );

        // Notify other participants that messages were read
        socketAdapter.emitToRoom(conversationId, 'messages_read', { userId });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = setupMessagingSocket;