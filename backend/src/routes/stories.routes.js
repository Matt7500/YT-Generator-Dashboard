import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../validators/validateRequest.js';
import { createStory } from '../services/story.service.js';

const router = Router();

// Create story endpoint with validation and sanitization
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required'),
    body('genre')
      .trim()
      .notEmpty().withMessage('Genre is required'),
    body('premise')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Premise must be at least 10 characters long'),
    body('channelId')
      .isNumeric().withMessage('Channel id must be numeric')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { title, genre, premise, channelId } = req.body;
      const data = await createStory({ title, genre, premise }, channelId);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router; 