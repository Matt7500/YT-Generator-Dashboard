const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const router = express.Router();

// Protected route - Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        // The user data is already attached to req.user by the verifyToken middleware
        res.json({
            user: {
                id: req.user.userId,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Protected route - Update user profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        // TODO: Implement profile update logic
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

module.exports = router; 