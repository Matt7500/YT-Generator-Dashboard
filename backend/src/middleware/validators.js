const { ValidationError } = require('../core/utils/errors');

const validateStoryGeneration = (req, res, next) => {
    const { channelId, prompt } = req.body;

    if (!channelId) {
        throw new ValidationError('Channel ID is required');
    }

    if (!prompt) {
        throw new ValidationError('Story prompt is required');
    }

    if (typeof prompt !== 'string' || prompt.trim().length < 10) {
        throw new ValidationError('Story prompt must be a string with at least 10 characters');
    }

    // Optional validation for story generation options
    const { options } = req.body;
    if (options) {
        if (typeof options !== 'object') {
            throw new ValidationError('Options must be an object');
        }

        const allowedOptions = ['genre', 'tone', 'length', 'style'];
        const invalidOptions = Object.keys(options).filter(key => !allowedOptions.includes(key));
        
        if (invalidOptions.length > 0) {
            throw new ValidationError(`Invalid options provided: ${invalidOptions.join(', ')}`);
        }
    }

    next();
};

module.exports = {
    validateStoryGeneration
}; 