const router = require('express').Router();
const youtubeService = require('../services/youtube.service');
const { requireAuth } = require('../middleware/auth.middleware');

// Get all YouTube accounts for the authenticated user
router.get('/accounts', requireAuth, async (req, res) => {
  try {
    const accounts = await youtubeService.getUserYouTubeAccounts(req.user.id);
    res.json(accounts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a specific YouTube account
router.get('/accounts/:id', requireAuth, async (req, res) => {
  try {
    const account = await youtubeService.getYouTubeAccount(req.params.id);
    
    // Check if the account belongs to the authenticated user
    if (account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this account' });
    }
    
    res.json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a new YouTube account
router.post('/accounts', requireAuth, async (req, res) => {
  try {
    const accountData = req.body;
    const account = await youtubeService.addYouTubeAccount(req.user.id, accountData);
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a YouTube account
router.put('/accounts/:id', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    const account = await youtubeService.getYouTubeAccount(req.params.id);
    
    // Check if the account belongs to the authenticated user
    if (account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this account' });
    }
    
    const updatedAccount = await youtubeService.updateYouTubeAccount(req.params.id, updates);
    res.json(updatedAccount);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a YouTube account
router.delete('/accounts/:id', requireAuth, async (req, res) => {
  try {
    const account = await youtubeService.getYouTubeAccount(req.params.id);
    
    // Check if the account belongs to the authenticated user
    if (account.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this account' });
    }
    
    await youtubeService.deleteYouTubeAccount(req.params.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 