
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    }
  });

// Request interceptor
api.interceptors.request.use(config => {
  // You can add auth tokens here if needed
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 403) {
    // Handle forbidden errors
    console.error('Forbidden request - check CORS configuration');
  }
  return Promise.reject(error);
});

export default api;