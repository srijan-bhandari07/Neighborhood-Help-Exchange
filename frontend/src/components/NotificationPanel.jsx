import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationPanel = ({ onClose }) => {
  const { notifications, loading, error, fetchNotifications } = useNotifications();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const nextPage = page + 1;
    const response = await fetchNotifications(nextPage);
    if (response?.notifications.length === 0) {
      setHasMore(false);
    }
    setPage(nextPage);
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-2">No notifications yet</div>
            <p className="text-gray-400 text-sm">
              You'll see notifications here when you receive messages or updates
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {hasMore && notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;