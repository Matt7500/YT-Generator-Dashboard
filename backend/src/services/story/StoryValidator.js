const logger = require('../../core/utils/logger');

class StoryValidator {
    constructor() {
        this.logger = logger;
    }

    async validate(story) {
        try {
            const errors = [];

            // Validate story structure
            if (!this.validateStructure(story)) {
                errors.push('Invalid story structure');
            }

            // Validate content
            const contentErrors = await this.validateContent(story);
            errors.push(...contentErrors);

            // Validate metadata
            if (!this.validateMetadata(story.metadata)) {
                errors.push('Invalid metadata');
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        } catch (error) {
            this.logger.error('Error in story validation', { error });
            throw error;
        }
    }

    validateStructure(story) {
        // Check if all required fields are present
        const requiredFields = [
            'storyIdea',
            'outline',
            'characters',
            'finalStory',
            'scenes',
            'originalScenes',
            'metadata'
        ];

        return requiredFields.every(field => story.hasOwnProperty(field));
    }

    async validateContent(story) {
        const errors = [];

        // Check story length
        if (!story.finalStory || story.finalStory.length < 1000) {
            errors.push('Story is too short');
        }

        // Check scene count matches metadata
        if (story.scenes.length !== story.metadata.numScenes) {
            errors.push('Scene count mismatch');
        }

        // Check for empty scenes
        if (story.scenes.some(scene => !scene || scene.trim().length === 0)) {
            errors.push('Empty scenes detected');
        }

        // Check characters exist
        if (!story.characters || story.characters.length === 0) {
            errors.push('No characters defined');
        }

        return errors;
    }

    validateMetadata(metadata) {
        const requiredMetadataFields = [
            'numScenes',
            'genre',
            'useReddit',
            'useFineTune'
        ];

        return requiredMetadataFields.every(field => 
            metadata.hasOwnProperty(field) && metadata[field] !== null
        );
    }
}

module.exports = StoryValidator; 