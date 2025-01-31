class ValidationError extends Error {
    constructor(errors) {
        super('Validation failed');
        this.name = 'ValidationError';
        this.errors = errors;
        this.status = 400;
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.status = 401;
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Not authorized') {
        super(message);
        this.name = 'AuthorizationError';
        this.status = 403;
    }
}

class ResourceNotFoundError extends Error {
    constructor(resource = 'Resource') {
        super(`${resource} not found`);
        this.name = 'ResourceNotFoundError';
        this.status = 404;
    }
}

class RateLimitError extends Error {
    constructor(message = 'Rate limit exceeded') {
        super(message);
        this.name = 'RateLimitError';
        this.status = 429;
    }
}

class APIError extends Error {
    constructor(message = 'API Error', status = 500) {
        super(message);
        this.name = 'APIError';
        this.status = status;
    }
}

class DatabaseError extends Error {
    constructor(message = 'Database operation failed') {
        super(message);
        this.name = 'DatabaseError';
        this.status = 500;
    }
}

module.exports = {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    RateLimitError,
    APIError,
    DatabaseError
}; 