const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { loginLimiter, validatePassword, verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Auth routes
router.post('/register', validatePassword, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', AuthController.logout);

// Verify route - returns user info if authenticated
router.get('/verify', verifyToken, (req, res) => {
    res.json({ 
        authenticated: true,
        user: req.user
    });
});

module.exports = router; 