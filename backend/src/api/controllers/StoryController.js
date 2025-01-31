const StoryService = require('../../services/story/StoryService');
const logger = require('../../core/utils/logger');
const { ResourceNotFoundError, AuthorizationError } = require('../../core/utils/errors');

class StoryController {
    constructor() {
        this.storyService = new StoryService();
    }

    generateStory = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { channelId, prompt, options } = req.body;

            logger.info(`Generating story for user ${userId} and channel ${channelId}`);
            const story = await this.storyService.generateStory(userId, channelId, prompt, options);

            res.status(201).json({
                success: true,
                data: story
            });
        } catch (error) {
            next(error);
        }
    };

    getStory = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { storyId } = req.params;

            const story = await this.storyService.getStory(storyId, userId);
            
            res.json({
                success: true,
                data: story
            });
        } catch (error) {
            next(error);
        }
    };

    listStories = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { page = 1, limit = 10, status } = req.query;

            const stories = await this.storyService.listUserStories(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });

            res.json({
                success: true,
                data: stories
            });
        } catch (error) {
            next(error);
        }
    };

    deleteStory = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { storyId } = req.params;

            await this.storyService.deleteStory(storyId, userId);

            res.json({
                success: true,
                message: 'Story deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    updateStoryStatus = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { storyId } = req.params;
            const { status } = req.body;

            const updatedStory = await this.storyService.updateStoryStatus(storyId, userId, status);

            res.json({
                success: true,
                data: updatedStory
            });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = StoryController; 