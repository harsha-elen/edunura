import axios from 'axios';

// Determine the API base URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create a configured axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Enable sending cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // For FormData uploads, let the browser set the Content-Type with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage and redirect to login
            localStorage.removeItem('user');
            // Clear cookies by calling logout endpoint
            apiClient.post('/auth/logout').catch(() => {});
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Export the base URL for static assets (without /api suffix)
export const STATIC_ASSETS_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

// Export API_BASE_URL for other services
export { API_BASE_URL };

export default apiClient;
