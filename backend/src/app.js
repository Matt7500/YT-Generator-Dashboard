require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const { 
    sessionMiddleware, 
    helmetMiddleware, 
    csrfProtection, 
    generateToken,
    auditLog, 
    errorLogger 
} = require('./middleware/security.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

// Security middleware
app.use(helmetMiddleware);
app.use(sessionMiddleware);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// CORS configuration
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    exposedHeaders: ['x-csrf-token', 'set-cookie']
}));

// Logging middleware
app.use(auditLog);

// CSRF protection for non-GET requests
app.use((req, res, next) => {
    if (req.method === 'GET') {
        return next();
    }
    csrfProtection(req, res, next);
});

// Provide CSRF token
app.get('/api/csrf-token', (req, res) => {
    res.json({ token: generateToken(req, res) });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Error handling
app.use(errorLogger);
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

module.exports = app; 