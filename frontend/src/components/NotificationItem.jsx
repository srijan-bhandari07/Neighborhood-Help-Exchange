import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification, onClose }) => {
  const { markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.relatedEntity) {
      switch (notification.relatedEntity.entityType) {
        case 'Conversation':
          navigate(`/messages/${notification.relatedEntity.entityId}`);
          break;
        case 'HelpPost':
          navigate('/'); // Will show the help post in the list
          break;
        default:
          break;
      }
    }

    onClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'new_message':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      case 'help_offered':
      case 'help_accepted':
      case 'help_rejected':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500">
            {formatTime(notification.createdAt)}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;