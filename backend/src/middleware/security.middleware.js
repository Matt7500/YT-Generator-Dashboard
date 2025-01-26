const helmet = require('helmet');
const session = require('express-session');
const { doubleCsrf } = require('csrf-csrf');
const logger = require('../config/logger');

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || process.env.COOKIE_SECRET, // Fallback to COOKIE_SECRET if SESSION_SECRET not set
    name: 'sessionId', // Don't use default connect.sid
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    resave: false,
    saveUninitialized: false
};

// CSRF Protection configuration
const { generateToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET || process.env.COOKIE_SECRET,
    cookieName: "x-csrf-token",
    cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production'
    },
    size: 64,
    getTokenFromRequest: (req) => req.headers["x-csrf-token"]
});

// Helmet configuration
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Modify based on your needs
    crossOriginResourcePolicy: { policy: "cross-origin" },
};

// Audit logging middleware
const auditLog = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('API Request', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id
        });
    });
    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    logger.error('API Error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
        userId: req.user?.id
    });
    next(err);
};

// Export middleware functions
module.exports = {
    sessionMiddleware: session(sessionConfig),
    helmetMiddleware: helmet(helmetConfig),
    csrfProtection: doubleCsrfProtection,
    generateToken,
    auditLog,
    errorLogger
}; 