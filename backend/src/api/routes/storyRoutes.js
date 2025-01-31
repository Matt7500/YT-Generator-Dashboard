const express = require('express');
const router = express.Router();
const StoryController = require('../controllers/StoryController');
const auth = require('../../middleware/auth');
const { validateStoryGeneration } = require('../../middleware/validators');

const storyController = new StoryController();

// Generate a new story
router.post(
    '/generate',
    auth,
    validateStoryGeneration,
    storyController.generateStory
);

// Get a specific story
router.get(
    '/:storyId',
    auth,
    storyController.getStory
);

// List user's stories
router.get(
    '/',
    auth,
    storyController.listStories
);

// Delete a story
router.delete(
    '/:storyId',
    auth,
    storyController.deleteStory
);

// Update story status
router.patch(
    '/:storyId/status',
    auth,
    storyController.updateStoryStatus
);

module.exports = router; 