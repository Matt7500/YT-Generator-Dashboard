import { Router } from 'express';
import * as authService from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const data = await authService.signUp(email, password, name);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await authService.signIn(email, password);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sign out
router.post('/signout', requireAuth, async (req, res) => {
  try {
    await authService.signOut();
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    const profile = await authService.updateProfile(req.user.id, updates);
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update password
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    await authService.updatePassword(newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request password reset
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    await authService.resetPassword(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    await authService.verifyEmail(token);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router; 