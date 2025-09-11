// context/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import api from '../utils/api'; // Import your axios instance

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

    const handleNewMessageNotification = (data) => {
      addNotification({
        _id: `msg-${Date.now()}`,
        type: 'new_message',
        title: 'New Message',
        message: `New message from ${data.message.sender?.username || 'Someone'}`,
        relatedEntity: {
          entityType: 'Conversation',
          entityId: data.conversation?._id
        },
        createdAt: new Date(),
        read: false
      });
    };

    const handleHelpPostNotification = (data) => {
      let title = '';
      let message = '';

      switch (data.type) {
        case 'help_offered':
          title = 'Help Offered';
          message = `Someone offered help on your post: ${data.helpPost?.title || 'Unknown post'}`;
          break;
        case 'help_accepted':
          title = 'Help Accepted';
          message = `Your help offer was accepted: ${data.helpPost?.title || 'Unknown post'}`;
          break;
        case 'help_rejected':
          title = 'Help Rejected';
          message = `Your help offer was rejected: ${data.helpPost?.title || 'Unknown post'}`;
          break;
        case 'status_changed':
          title = 'Status Updated';
          message = `Help request status changed: ${data.helpPost?.title || 'Unknown post'}`;
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
          entityId: data.helpPost?._id
        },
        createdAt: new Date(),
        read: false
      });
    };

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
      setError('');
      const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
      
      // Check the response structure
      console.log('Notifications API response:', response.data);
      
      // Adjust based on your actual API response structure
      if (response.data.success) {
        setNotifications(response.data.data?.notifications || response.data.notifications || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
      setNotifications([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      console.log('Unread count response:', response.data);
      
      if (response.data.success) {
        setUnreadCount(response.data.data?.count || response.data.count || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
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
      await api.put('/notifications/read/all');
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