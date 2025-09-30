// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://3.27.68.115:5001/api',
  //baseURL: 'http://localhost:5001/api',
  withCredentials: true, // This is important for sending cookies/auth headers
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default api;