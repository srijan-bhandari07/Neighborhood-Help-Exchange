import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Fetch initial notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    // New message notification
    const handleNewMessageNotification = (data) => {
      addNotification({
        _id: `msg-${Date.now()}`,
        type: 'new_message',
        title: 'New Message',
        message: `New message from ${data.message.sender.username}`,
        relatedEntity: {
          entityType: 'Conversation',
          entityId: data.conversation._id
        },
        createdAt: new Date(),
        read: false
      });
    };

    // Help post notifications
    const handleHelpPostNotification = (data) => {
      let title = '';
      let message = '';

      switch (data.type) {
        case 'help_offered':
          title = 'Help Offered';
          message = `Someone offered help on your post: ${data.helpPost.title}`;
          break;
        case 'help_accepted':
          title = 'Help Accepted';
          message = `Your help offer was accepted: ${data.helpPost.title}`;
          break;
        case 'help_rejected':
          title = 'Help Rejected';
          message = `Your help offer was rejected: ${data.helpPost.title}`;
          break;
        case 'status_changed':
          title = 'Status Updated';
          message = `Help request status changed: ${data.helpPost.title}`;
          break;
        default:
          title = 'Help Post Update';
          message = data.message || 'Your help post was updated';
      }

      addNotification({
        _id: `help-${Date.now()}`,
        type: data.type,
        title,
        message,
        relatedEntity: {
          entityType: 'HelpPost',
          entityId: data.helpPost._id
        },
        createdAt: new Date(),
        read: false
      });
    };

    // System notifications
    const handleSystemNotification = (data) => {
      addNotification({
        _id: `sys-${Date.now()}`,
        type: 'system',
        title: 'System Notification',
        message: data.message,
        createdAt: new Date(),
        read: false
      });
    };

    socket.on('new_message_notification', handleNewMessageNotification);
    socket.on('help_post_notification', handleHelpPostNotification);
    socket.on('system_notification', handleSystemNotification);

    return () => {
      socket.off('new_message_notification', handleNewMessageNotification);
      socket.off('help_post_notification', handleHelpPostNotification);
      socket.off('system_notification', handleSystemNotification);
    };
  }, [socket, isConnected]);

  const fetchNotifications = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notifications?page=${page}&limit=${limit}`);
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/unread/count'); // Updated endpoint
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Set to 0 if endpoint doesn't exist yet
      setUnreadCount(0);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true, readAt: new Date() } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read/all'); // Updated endpoint
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    clearError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};