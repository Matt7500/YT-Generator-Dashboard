const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Token verification failed:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        logger.warn(`Unauthorized admin access attempt by user ${req.user.id}`);
        return res.status(403).json({ message: 'Admin access required' });
    }

    // In production, add additional security checks
    if (process.env.NODE_ENV === 'production') {
        // Add IP whitelist check, 2FA requirement, etc.
        logger.info(`Admin access by user ${req.user.id} in production`);
    }

    next();
};

module.exports = {
    verifyToken,
    isAdmin
}; 