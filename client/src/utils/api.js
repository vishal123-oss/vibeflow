import axios from 'axios';
import { getStorage } from './storage';

/**
 * Prod API client (centralized axios; interceptor, base, error handling).
 * Replaces direct axios calls (AuthContext, pages); env-aware.
 */
const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  withCredentials: true, // For refresh cookie from BE
});

// Request interceptor for auth token (prod: central; uses storage util)
apiClient.interceptors.request.use((config) => {
  const token = getStorage('token'); // From utils/storage for prefix/safety
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for refresh/error (prod: centralized logging)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Relevant: auth errors only; avoid noise
    if (error.response?.status === 401) {
      // Token refresh handled in contexts
    }
    return Promise.reject(error);
  }
);

export default apiClient;