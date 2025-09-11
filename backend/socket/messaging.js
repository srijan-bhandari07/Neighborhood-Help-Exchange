const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const setupMessagingSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User left conversation: ${conversationId}`);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, senderId } = data;

        // Create new message
        const message = new Message({
          conversation: conversationId,
          sender: senderId,
          content
        });

        await message.save();

        // Update conversation's last message and activity
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = message._id;
          conversation.lastActivity = new Date();
          await conversation.save();
        }

        // Populate sender info
        await message.populate('sender', 'username');

        // Emit to all users in the conversation
        io.to(conversationId).emit('new_message', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('mark_as_read', async (data) => {
      try {
        const { conversationId, userId } = data;

        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: userId },
            read: false
          },
          { $set: { read: true } }
        );

        // Notify other participants that messages were read
        socket.to(conversationId).emit('messages_read', { userId });
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