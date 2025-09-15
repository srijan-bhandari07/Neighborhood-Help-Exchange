// hooks/useHelpPosts.js - enhanced version
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export const useHelpPosts = (initialPosts = []) => {
  const [posts, setPosts] = useState(initialPosts);
  const { socket, isConnected } = useSocket();
  const refreshIntervalRef = useRef(null);

  // Function to manually refresh posts
  const refreshPosts = async () => {
    try {
      const response = await axios.get('/api/help');
      setPosts(response.data.helpPosts || []);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  };

  useEffect(() => {
    if (!socket || !isConnected) {
      // Set up polling if socket is disconnected
      refreshIntervalRef.current = setInterval(refreshPosts, 10000); // Refresh every 10 seconds
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }

    const handleNewHelpPost = (newPost) => {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    const handleUpdatedHelpPost = (updatedPost) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === updatedPost._id ? updatedPost : post
        )
      );
    };

    const handleDeletedHelpPost = (postId) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    };

    // Listen for help post events
    socket.on('new_help_post', handleNewHelpPost);
    socket.on('updated_help_post', handleUpdatedHelpPost);
    socket.on('deleted_help_post', handleDeletedHelpPost);

    // Clear polling interval when socket is connected
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    return () => {
      socket.off('new_help_post', handleNewHelpPost);
      socket.off('updated_help_post', handleUpdatedHelpPost);
      socket.off('deleted_help_post', handleDeletedHelpPost);
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [socket, isConnected]);

  return [posts, setPosts, refreshPosts]; // Return refresh function too
};