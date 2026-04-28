import axios, { AxiosInstance, AxiosError } from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

// Extract base URL for static assets (remove /api suffix)
export const STATIC_ASSETS_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        // Debug: Log outgoing request
        console.log('[API Request]', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            timestamp: new Date().toISOString(),
        });

        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('[Auth Token]', 'Token attached to request');
            }
        }

        // Don't set Content-Type for FormData - let axios handle it
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => {
        // Debug: Log successful response
        console.log('[API Response Success]', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            data: response.data,
            timestamp: new Date().toISOString(),
        });
        return response;
    },
    (error: AxiosError) => {
        // Debug: Log error response
        console.error('[API Response Error]', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            data: error.response?.data,
            message: error.message,
            timestamp: new Date().toISOString(),
        });

        if (typeof window !== 'undefined' && error.response?.status === 401) {
            console.warn('[Auth] 401 Unauthorized - Clearing tokens and redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
