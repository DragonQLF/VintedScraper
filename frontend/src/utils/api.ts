import axios from 'axios';

// Add type declaration for Vite's import.meta.env
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
    };
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {};
      // Set Authorization header with Bearer token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Don't redirect for auth endpoints to prevent redirect loops
      if (!error.config.url?.includes('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use window.location.replace to prevent back button issues
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export { api }; 