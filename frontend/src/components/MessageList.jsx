import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const MessageList = () => {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join conversation room
    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (message) => {
      if (message.conversation === conversationId) {
        setMessages(prev => [...prev, message]);
        // Mark as read if it's from the other participant
        if (message.sender._id !== user._id && message.sender._id !== user.id) {
          markAsRead();
        }
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, conversationId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

 
  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/conversations/${conversationId}`);
      setConversation(response.data.conversation);
      setMessages(response.data.messages || []);
      
      // Mark messages as read
      await markAsRead();
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await axios.put(`/api/messages/conversations/${conversationId}/read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      if (socket && isConnected) {
        // Use socket for real-time messaging
        socket.emit('send_message', {
          conversationId,
          content: newMessage.trim(),
          senderId: user._id || user.id
        });
      } else {
        // Fallback to HTTP API if socket is not connected
        const response = await axios.post(
          `/api/messages/conversations/${conversationId}/messages`,
          { content: newMessage.trim() }
        );
        setMessages(prev => [...prev, response.data]);
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    return conversation.participants.find(
      participant => participant._id !== user._id && participant._id !== user.id
    );
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12 text-gray-500">
        Conversation not found
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {otherParticipant?.username?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {otherParticipant?.username || 'Unknown User'}
              {otherParticipant?.studentId && ` (${otherParticipant.studentId})`}
            </h3>
            {conversation.helpPost && (
              <p className="text-xs text-gray-500">
                Re: {conversation.helpPost.title}
              </p>
            )}
            {!isConnected && (
              <p className="text-xs text-yellow-600 mt-1">
                Connection issues - using fallback mode
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.sender._id === user._id || message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender._id === user._id || message.sender._id === user.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender._id === user._id || message.sender._id === user.id
                      ? 'text-blue-200'
                      : 'text-gray-500'
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        {!isConnected && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm">
            Real-time messaging unavailable. Messages may be delayed.
          </div>
        )}
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageList;