const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Protect all admin routes with authentication and admin check
router.use(verifyToken, isAdmin);

// Get all users
router.get('/users', AdminController.getAllUsers);

// Get user by ID
router.get('/users/:id', AdminController.getUserById);

// Update user role
router.patch('/users/:id/role', AdminController.updateUserRole);

// Get admin dashboard stats
router.get('/stats', AdminController.getDashboardStats);

module.exports = router; 