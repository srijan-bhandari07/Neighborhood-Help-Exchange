import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const ConversationList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    fetchConversations();
    
    if (socket && isConnected) {
      const handleNewMessage = (message) => {
        // Refresh conversations when a new message is received
        fetchConversations();
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }
  }, [socket, isConnected]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/messages/conversations');
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants || !user) return null;
    return conversation.participants.find(
      participant => participant._id !== user._id && participant._id !== user.id
    );
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    return conversation.lastMessage.content.length > 50 
      ? `${conversation.lastMessage.content.substring(0, 50)}...`
      : conversation.lastMessage.content;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        <p className="text-sm text-gray-500 mt-1">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-2">No conversations yet</div>
            <p className="text-gray-400 text-sm">
              Start a conversation by accepting a help offer on your posts
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            return (
              <Link
                key={conversation._id}
                to={`/messages/${conversation._id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {otherParticipant?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {otherParticipant?.username || 'Unknown User'}
                        {otherParticipant?.studentId && ` (${otherParticipant.studentId})`}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(conversation.lastActivity)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                    {conversation.helpPost && (
                      <p className="text-xs text-gray-500 mt-1">
                        Re: {conversation.helpPost.title}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;