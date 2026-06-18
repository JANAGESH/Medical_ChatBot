import axios from 'axios';

// Create structured Axios client.
// In dev, Vite proxies /api to http://localhost:10000.
// In production (Render/Vercel), we can override the API URL using an environment variable if needed.
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Bearer Token into every outgoing request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aegis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Unified Authentication Utilities
export const authService = {
  getToken: () => localStorage.getItem('aegis_token'),
  
  setToken: (token) => localStorage.setItem('aegis_token', token),
  
  clearToken: () => {
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_user');
  },
  
  getUser: () => {
    const user = localStorage.getItem('aegis_user');
    return user ? JSON.parse(user) : null;
  },
  
  setUser: (user) => localStorage.setItem('aegis_user', JSON.stringify(user)),
  
  isAuthenticated: () => {
    return !!localStorage.getItem('aegis_token');
  }
};

export default api;
