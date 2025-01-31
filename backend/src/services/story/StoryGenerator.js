const logger = require('../../core/utils/logger');
const OpenAIClient = require('../../core/clients/OpenAIClient');
const OpenRouterClient = require('../../core/clients/OpenRouterClient');

class StoryGenerator {
    constructor(openAIClient, openRouterClient) {
        this.openAIClient = openAIClient;
        this.openRouterClient = openRouterClient;
        this.logger = logger;
    }

    async generate(options) {
        try {
            // Generate initial story idea
            const storyIdea = await this.generateStoryIdea(options);
            
            // Create story outline
            const outline = await this.createOutline(storyIdea, options.numScenes);
            
            // Generate characters
            const characters = await this.generateCharacters(outline);
            
            // Write the full story
            const [story, editedScenes, originalScenes] = await this.writeStory(outline, characters);
            
            return {
                storyIdea,
                outline,
                characters,
                finalStory: story,
                scenes: editedScenes,
                originalScenes,
                metadata: {
                    numScenes: options.numScenes,
                    genre: options.storyProfile,
                    useReddit: options.useReddit,
                    useFineTune: options.useFineTune
                }
            };
        } catch (error) {
            this.logger.error('Error in story generation', { error, options });
            throw error;
        }
    }

    async generateStoryIdea(options) {
        // Implementation moved from story_writer.js
        try {
            if (options.useReddit) {
                return this.findLongPost(options.storyProfile);
            } else if (options.useFineTune) {
                return this.generateFineTunedStory(options);
            } else {
                return this.generateBaseStory(options);
            }
        } catch (error) {
            this.logger.error('Error generating story idea', { error, options });
            throw error;
        }
    }

    async createOutline(storyIdea, numScenes) {
        // Implementation moved from story_writer.js
        try {
            const outline = await this.openAIClient.createOutline(storyIdea, numScenes);
            return this.formatScenes(outline);
        } catch (error) {
            this.logger.error('Error creating outline', { error, storyIdea, numScenes });
            throw error;
        }
    }

    async generateCharacters(outline) {
        // Implementation moved from story_writer.js
        try {
            return await this.openRouterClient.generateCharacters(outline);
        } catch (error) {
            this.logger.error('Error generating characters', { error });
            throw error;
        }
    }

    async writeStory(outline, characters) {
        // Implementation moved from story_writer.js
        try {
            return await this.openRouterClient.writeStory(outline, characters);
        } catch (error) {
            this.logger.error('Error writing story', { error });
            throw error;
        }
    }

    // Helper methods moved from story_writer.js
    formatScenes(outline) {
        // Implementation of formatScenes
    }

    async findLongPost(storyProfile) {
        // Implementation of findLongPost
    }

    async generateFineTunedStory(options) {
        // Implementation of fine-tuned story generation
    }

    async generateBaseStory(options) {
        // Implementation of base story generation
    }
}

module.exports = StoryGenerator; 