import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const HelpPostCard = ({
  post,
  onOfferHelp = async () => {},
  onAcceptHelp = async () => {},
  onRejectHelp = async () => {},
  onUpdateStatus = async () => {},
  onDelete = () => {},
  onEdit = () => {},
  showActions = false,
  isAuthor = false
}) => {
  const [showHelpers, setShowHelpers] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [actioningHelperId, setActioningHelperId] = useState(null);
  const { user } = useAuth();

  if (!post) return null;

  // ---- compute first (before any JSX uses them) ----
  const author  = post.author || {};
  const helpers = Array.isArray(post.helpers) ? post.helpers : [];

  // normalize current user id to handle either user._id or user.id from auth
  const currentUserId = String(user?._id || user?.id || '');

  const isUserAuthor = Boolean(currentUserId && String(author?._id) === currentUserId);

  const hasOfferedHelp = Boolean(
    currentUserId && helpers.some(h => String(h.user?._id) === currentUserId)
  );

  const canOfferHelp =
    showActions && user && !(isAuthor || isUserAuthor) && !hasOfferedHelp && post.status === 'open';
  // --------------------------------------------------

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Shopping: 'bg-blue-100 text-blue-800',
      Transport: 'bg-purple-100 text-purple-800',
      'Study Help': 'bg-indigo-100 text-indigo-800',
      'Food Delivery': 'bg-orange-100 text-orange-800',
      'Ride Share': 'bg-green-100 text-green-800',
      'Book Exchange': 'bg-pink-100 text-pink-800',
      'Project Help': 'bg-red-100 text-red-800',
      Other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleOfferHelp = async () => {
    if (!onOfferHelp) return;
    setLoading(true);
    try {
      const result = await onOfferHelp(post._id, offerMessage);
      if (result?.success) {
        setShowOfferForm(false);
        setOfferMessage('');
      } else {
        alert(result?.message || 'Failed to offer help');
      }
    } catch (error) {
      alert('An error occurred while offering help');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {post.title || 'Untitled Post'}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                {post.category || 'Other'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                {(post.status || 'open').replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{post.description || 'No description provided'}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Location:</span>
            <span className="ml-2">{post.location || 'N/A'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Needed by:</span>
            <span className="ml-2">{formatDate(post.neededBy)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Posted by:</span>
            <span className="ml-2">
              {author.username || 'Anonymous'} {author.studentId && `(${author.studentId})`}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Posted:</span>
            <span className="ml-2">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Helpers ({helpers.length})
            </span>
            {helpers.length > 0 && (
              <button
                onClick={() => setShowHelpers(!showHelpers)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showHelpers ? 'Hide' : 'Show'} helpers
              </button>
            )}
          </div>

          {showHelpers && helpers.length > 0 && (
            <div className="mt-3 space-y-2">
              {helpers.map((helper, index) => (
                <div
                  key={helper._id || helper.user?._id || index}
                  className="bg-gray-50 p-3 rounded-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-sm text-gray-900">
                        {helper.user?.username || 'Anonymous'}
                        {helper.user?.studentId && ` (${helper.user.studentId})`}
                      </span>
                      <div className="text-xs text-gray-500">
                        Offered help on {formatDate(helper.offeredAt)}
                        {helper.status !== 'pending' && (
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              helper.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {helper.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {helper.message && (
                    <p className="text-sm text-gray-600 mt-2">{helper.message}</p>
                  )}

                  {(isUserAuthor || isUserAuthor) && helper.status === 'pending' && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={async () => {
                          setActioningHelperId(helper._id);
                          await onAcceptHelp(post._id, helper._id);
                          setActioningHelperId(null);
                        }}
                        disabled={actioningHelperId === helper._id}
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-1 px-3 rounded-md text-sm transition-colors"
                      >
                        {actioningHelperId === helper._id ? 'Accepting…' : 'Accept'}
                      </button>
                      <button
                        onClick={async () => {
                          setActioningHelperId(helper._id);
                          await onRejectHelp(post._id, helper._id);
                          setActioningHelperId(null);
                        }}
                        disabled={actioningHelperId === helper._id}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-1 px-3 rounded-md text-sm transition-colors"
                      >
                        {actioningHelperId === helper._id ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {canOfferHelp && (
          <div className="space-y-3">
            {!showOfferForm ? (
              <button
                onClick={() => setShowOfferForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                Offer Help
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Add a message (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleOfferHelp}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Offering...' : 'Offer Help'}
                  </button>
                  <button
                    onClick={() => {
                      setShowOfferForm(false);
                      setOfferMessage('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {(isAuthor || isUserAuthor) && (
          <div className="flex space-x-2 mt-4">
            {post.status !== 'completed' && (
              <select
                value={post.status || 'open'}
                onChange={(e) => onUpdateStatus(post._id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            )}
            {isAuthor && (
              <>
                <button
                  onClick={() => onEdit(post)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this post?')) {
                      onDelete(post._id);
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPostCard;
