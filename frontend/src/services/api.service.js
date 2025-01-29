const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiService {
    constructor() {
        if (!API_BASE_URL) {
            console.error('VITE_API_URL environment variable is not set');
            throw new Error('API URL is not configured');
        }
        this.baseUrl = API_BASE_URL;
        console.log('ApiService initialized with base URL:', this.baseUrl);
    }

    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        console.log('=== Starting API Request ===');
        console.log('Request details:', {
            url,
            method: options.method || 'GET',
            headers: options.headers,
            bodyLength: options.body ? options.body.length : 0
        });

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                credentials: 'include',
            });

            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log('Response data:', data);
            } else {
                const text = await response.text();
                console.log('Response text:', text);
                data = { message: text };
            }
            
            if (!response.ok) {
                console.error('=== API Request Failed ===');
                console.error('Error details:', {
                    status: response.status,
                    data
                });
                throw new Error(data.error || data.message || 'Request failed');
            }

            console.log('=== API Request Successful ===');
            console.log('Response details:', {
                endpoint,
                status: response.status,
                dataKeys: Object.keys(data)
            });

            return data;
        } catch (error) {
            console.error('=== API Request Error ===');
            console.error('Error details:', {
                endpoint,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

export const apiService = new ApiService(); 