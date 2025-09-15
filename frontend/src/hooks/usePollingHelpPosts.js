// hooks/usePollingHelpPosts.js
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export const usePollingHelpPosts = (filters = {}, pollInterval = 5000) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const fetchPosts = useCallback(async () => {
    try {
      setError('');
      
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
  }, [filters.category, filters.status]);

  useEffect(() => {
    fetchPosts(); // Initial fetch

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new polling interval
    intervalRef.current = setInterval(fetchPosts, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPosts, pollInterval]);

  // Function to update a specific post in the list
  const updatePost = useCallback((postId, updatedPost) => {
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post._id === postId ? updatedPost : post
      )
    );
  }, []);

  // Function to remove a post from the list
  const removePost = useCallback((postId) => {
    setPosts(currentPosts => 
      currentPosts.filter(post => post._id !== postId)
    );
  }, []);

  return { 
    posts, 
    loading, 
    error,
    refresh: fetchPosts,
    updatePost,
    removePost
  };
};