import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HelpPostForm = ({ 
  post = null,
  onSubmit, 
  onCancel 
}) => {
  // Initialize formData based on post prop
  const [formData, setFormData] = useState({
    title: post?.title || '',
    description: post?.description || '',
    category: post?.category || '',
    location: post?.location || '',
    neededBy: post?.neededBy ? formatDateForInput(post.neededBy) : ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    'Shopping', 'Transport', 'Study Help', 'Food Delivery', 
    'Ride Share', 'Book Exchange', 'Project Help', 'Other'
  ];

  // Helper function to format date for datetime-local input
  function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  // Update formData when post changes
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        description: post.description || '',
        category: post.category || '',
        location: post.location || '',
        neededBy: post.neededBy ? formatDateForInput(post.neededBy) : ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        neededBy: ''
      });
    }
  }, [post]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (post) {
        // Edit mode
        const result = await onSubmit(formData);
        if (result?.success) {
          setSuccess('Help request updated successfully!');
          setTimeout(() => setSuccess(''), 2000);
        } else {
          setError(result?.message || 'Failed to update help request');
        }
      } else {
        // Create mode
        await axios.post('/api/help', formData);
        setSuccess('Help request created successfully!');
        setFormData({
          title: '',
          description: '',
          category: '',
          location: '',
          neededBy: ''
        });
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 
        (post ? 'Failed to update help request' : 'Failed to create help request'));
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {post ? 'Edit Help Request' : 'Create Help Request'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {post ? 'Update your help request details' : 'Let your community know what kind of help you need'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Form fields remain the same as before */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of what you need help with"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide more details about what you need help with"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Where do you need help? (e.g., Campus Library, Downtown Mall)"
            />
          </div>

          <div>
            <label htmlFor="neededBy" className="block text-sm font-medium text-gray-700 mb-2">
              Needed By *
            </label>
            <input
              type="datetime-local"
              id="neededBy"
              name="neededBy"
              required
              value={formData.neededBy}
              onChange={handleChange}
              min={getMinDateTime()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              When do you need this help by?
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-6 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {loading 
                ? (post ? 'Updating...' : 'Creating...') 
                : (post ? 'Update Help Request' : 'Create Help Request')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HelpPostForm;