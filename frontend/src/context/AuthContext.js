import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    // Basic token validation - check if it looks like a JWT
    if (savedToken && savedToken.trim() && savedToken.split('.').length === 3) {
      return savedToken.trim();
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set default axios header
  useEffect(() => {
    if (token && token.trim()) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.trim()}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      const response = await axios.post('/api/auth/login', { 
        email: email.trim(), 
        password 
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Validate token format before storing
      if (!newToken || typeof newToken !== 'string' || newToken.split('.').length !== 3) {
        throw new Error('Invalid token received from server');
      }
      
      const cleanToken = newToken.trim();
      setToken(cleanToken);
      setUser(userData);
      localStorage.setItem('token', cleanToken);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      
      // Validate required fields
      const { username, email, password, studentId } = userData;
      
      if (!username || !email || !password || !studentId) {
        const errorMessage = 'All fields are required';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }

      if (password.length < 6) {
        const errorMessage = 'Password must be at least 6 characters';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }

      // Clean data
      const cleanData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        studentId: studentId.trim()
      };
      
      const response = await axios.post('/api/auth/register', cleanData);
      const { token: newToken, user: newUser } = response.data;
      
      // Validate token format before storing
      if (!newToken || typeof newToken !== 'string' || newToken.split('.').length !== 3) {
        throw new Error('Invalid token received from server');
      }
      
      const cleanToken = newToken.trim();
      setToken(cleanToken);
      setUser(newUser);
      localStorage.setItem('token', cleanToken);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data?.errors && error.response.data.errors.length > 0 
                           ? error.response.data.errors[0].msg 
                           : 'Registration failed');
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError('');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const clearError = () => {
    setError('');
  };

  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh user:', error);
      if (error.response?.status === 401) {
        logout();
      }
      return { success: false, message: 'Failed to refresh user data' };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!(token && user);
  };

  // Get user role (if you plan to add roles later)
  const getUserRole = () => {
    return user?.role || 'student';
  };

  // Check if current user is the author of a post
  const isPostAuthor = (post) => {
    return user && post && post.author && 
           (post.author._id === user.id || post.author._id === user._id);
  };

  // Check if user has already offered help on a post
  const hasOfferedHelp = (post) => {
    if (!user || !post || !post.helpers) return false;
    return post.helpers.some(helper => 
      helper.user._id === user.id || helper.user._id === user._id
    );
  };

  const value = {
    // State
    user,
    token,
    loading,
    error,
    
    // Actions
    login,
    register,
    logout,
    clearError,
    updateUser,
    refreshUser,
    
    // Utility functions
    isAuthenticated,
    getUserRole,
    isPostAuthor,
    hasOfferedHelp
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};