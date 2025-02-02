/**
 * Simple logger utility for consistent logging across the application
 */
export const logger = {
    /**
     * Log an info message
     * @param {string} message - The message to log
     * @param {Object} [data] - Additional data to log
     */
    info: (message, data = {}) => {
        console.log(`[INFO] ${message}`, data);
    },

    /**
     * Log an error message
     * @param {string} message - The error message
     * @param {Object} [data] - Additional error data
     */
    error: (message, data = {}) => {
        console.error(`[ERROR] ${message}`, data);
    },

    /**
     * Log a warning message
     * @param {string} message - The warning message
     * @param {Object} [data] - Additional warning data
     */
    warn: (message, data = {}) => {
        console.warn(`[WARN] ${message}`, data);
    },

    /**
     * Log a debug message (only in development)
     * @param {string} message - The debug message
     * @param {Object} [data] - Additional debug data
     */
    debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, data);
        }
    }
}; 