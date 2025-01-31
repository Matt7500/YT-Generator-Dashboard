const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    channelId: {
        type: String,
        required: true,
        index: true
    },
    storyIdea: {
        type: String,
        required: true
    },
    outline: [{
        type: String,
        required: true
    }],
    characters: {
        type: String,
        required: true
    },
    finalStory: {
        type: String,
        required: true
    },
    scenes: [{
        type: String,
        required: true
    }],
    originalScenes: [{
        type: String,
        required: true
    }],
    metadata: {
        numScenes: {
            type: Number,
            required: true
        },
        genre: {
            type: String,
            required: true
        },
        useReddit: {
            type: Boolean,
            default: false
        },
        useFineTune: {
            type: Boolean,
            default: false
        }
    },
    status: {
        type: String,
        enum: ['pending', 'generating', 'completed', 'failed'],
        default: 'pending'
    },
    error: {
        message: String,
        stack: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
StorySchema.index({ userId: 1, createdAt: -1 });
StorySchema.index({ channelId: 1, createdAt: -1 });
StorySchema.index({ status: 1 });

// Instance methods
StorySchema.methods.updateStatus = async function(status, error = null) {
    this.status = status;
    if (error) {
        this.error = {
            message: error.message,
            stack: error.stack
        };
    }
    return this.save();
};

// Static methods
StorySchema.statics.findByUserId = function(userId, options = {}) {
    const query = { userId };
    const { status, limit = 10, skip = 0, sort = { createdAt: -1 } } = options;
    
    if (status) {
        query.status = status;
    }
    
    return this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

const Story = mongoose.model('Story', StorySchema);

module.exports = Story; 