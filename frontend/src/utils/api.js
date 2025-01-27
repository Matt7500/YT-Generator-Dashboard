import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add CSRF token
api.interceptors.request.use(async (config) => {
    // Only add CSRF token for non-GET requests
    if (config.method !== 'get') {
        try {
            // Get CSRF token if we don't have one
            if (!api.csrfToken) {
                const response = await axios.get(`${BACKEND_URL}/api/csrf-token`, {
                    withCredentials: true
                });
                api.csrfToken = response.data.token;
            }
            // Add token to headers
            config.headers['x-csrf-token'] = api.csrfToken;
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
        }
    }
    return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response) {
            // Handle 401 (Unauthorized)
            if (error.response.status === 401) {
                // Redirect to login page if not authenticated
                window.location.href = '/login';
                return Promise.reject(error);
            }
            
            // Handle 403 (CSRF token expired)
            if (error.response.status === 403 && error.response.data?.error === 'invalid csrf token') {
                // Clear the stored token
                api.csrfToken = null;
                // Retry the request
                const config = error.config;
                // Remove the old CSRF token
                delete config.headers['x-csrf-token'];
                // Retry the request
                return api(config);
            }
        }
        return Promise.reject(error);
    }
);

export default api; 