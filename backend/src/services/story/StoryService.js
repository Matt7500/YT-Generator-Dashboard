const { ValidationError } = require('../../core/utils/errors');
const logger = require('../../core/utils/logger');

class StoryService {
    constructor(storyGenerator, storyValidator, storyRepository) {
        this.storyGenerator = storyGenerator;
        this.storyValidator = storyValidator;
        this.storyRepository = storyRepository;
        this.logger = logger;
    }

    async generateStory(userId, channelId, options) {
        try {
            this.logger.info('Starting story generation', { userId, channelId });
            
            // Generate the story
            const story = await this.storyGenerator.generate(options);
            
            // Validate the story meets quality standards
            const validationResult = await this.storyValidator.validate(story);
            if (!validationResult.isValid) {
                throw new ValidationError(validationResult.errors);
            }
            
            // Save to database
            const savedStory = await this.storyRepository.save({
                userId,
                channelId,
                content: story,
                createdAt: new Date(),
                status: 'completed'
            });
            
            return savedStory;
        } catch (error) {
            this.logger.error('Story generation failed', { error, userId, channelId });
            throw error;
        }
    }

    async getStory(storyId, userId) {
        try {
            const story = await this.storyRepository.findById(storyId);
            if (!story) {
                throw new Error('Story not found');
            }
            if (story.userId !== userId) {
                throw new Error('Unauthorized access to story');
            }
            return story;
        } catch (error) {
            this.logger.error('Error retrieving story', { error, storyId, userId });
            throw error;
        }
    }

    async listUserStories(userId, options = {}) {
        try {
            return await this.storyRepository.findByUserId(userId, options);
        } catch (error) {
            this.logger.error('Error listing user stories', { error, userId });
            throw error;
        }
    }
}

module.exports = StoryService; 