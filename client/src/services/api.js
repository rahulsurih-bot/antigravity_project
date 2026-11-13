import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for token attachment
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrismart_token') || '00000000-0000-0000-0000-000000000001';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent response data access
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    const details = error.response?.data?.error?.details || [];
    return Promise.reject(new Error(details.length > 0 ? details.join(', ') : message));
  }
);
