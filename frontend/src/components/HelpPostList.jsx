import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HelpPostCard from './HelpPostCard';

const HelpPostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: 'open'
  });

  const categories = [
    'All Categories',
    'Shopping',
    'Transport',
    'Study Help',
    'Food Delivery',
    'Ride Share',
    'Book Exchange',
    'Project Help',
    'Other'
  ];

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'All Categories') {
        params.append('category', filters.category);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }

      const response = await axios.get(`/api/help?${params.toString()}`);
      setPosts(response.data.helpPosts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load help posts');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferHelp = async (postId, message = '') => {
    try {
      const response = await axios.post(`/api/help/${postId}/offer-help`, { message });
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to offer help';
      console.error('Error offering help:', error);
      return { success: false, message: errorMessage };
    }
  };

  const handleAcceptHelp = async (postId, helperId) => {
    try {


      const response = await axios.put(`/api/help/${postId}/accept/${helperId}`);
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to accept help offer';
      console.error('Error accepting help:', error);
      return { success: false, message: errorMessage };
    }
  };

  const handleRejectHelp = async (postId, helperId) => {
    try {
      const response = await axios.put(`/api/help/${postId}/reject/${helperId}`);
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject help offer';
      console.error('Error rejecting help:', error);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateStatus = async (postId, status) => {
    try {
      const response = await axios.put(`/api/help/${postId}/status`, { status });
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      console.error('Error updating status:', error);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`/api/help/${postId}`);
      setPosts(posts.filter(post => post._id !== postId));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete post';
      console.error('Error deleting post:', error);
      return { success: false, message: errorMessage };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4">
          {/* Category Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="appearance-none w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 transition-all duration-200 ease-in-out hover:border-gray-300"
              >
                {categories.map(category => (
                  <option 
                    key={category} 
                    value={category === 'All Categories' ? '' : category}
                    className="text-gray-700"
                  >
                    {category}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="appearance-none w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 transition-all duration-200 ease-in-out hover:border-gray-300"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No help requests found</div>
          <p className="text-gray-400 mt-2">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <HelpPostCard
              key={post._id}
              post={post}
              onOfferHelp={handleOfferHelp}
              onAcceptHelp={handleAcceptHelp}
              onRejectHelp={handleRejectHelp}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeletePost}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpPostList;