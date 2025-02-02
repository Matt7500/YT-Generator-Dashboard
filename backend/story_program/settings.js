import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// General Settings
const settings = {
    // API Keys
    OAI_API_KEY: process.env.OPENAI_API_KEY,
    OR_API_KEY: process.env.OPENROUTER_API_KEY,
    VOICE_API_KEY: null,
    PEXELS_API_KEY: null,
    REPLICATE_API_KEY: null,

    // Reddit Settings
    REDDIT_CLIENT_ID: null,
    REDDIT_CLIENT_SECRET: null,
    REDDIT_USER_AGENT: "Reddit posts",

    // AI Model Settings
    OAI_MODEL: null,
    OR_MODEL: process.env.OPENROUTER_MODEL || "anthropic/claude-2",
    FT_MODEL: null,
    VOICE_MODEL: null,

    // AWS Settings
    INSTANCE_TYPE: null,
    INSTANCE_STORAGE: null,
    CONCURRENT_EC2_INSTANCES: false,
    AMI_ID: null,
    KEY_NAME: null,
    KEY_FILE: null,
    SECURITY_GROUP: null,
    BASE_INSTANCE_NAME: null,
    AWS_ACCESS_KEY: null,
    AWS_SECRET_KEY: null,
    REGION: null,

    // Video Generation Settings
    USE_LOCAL_GENERATION: true,

    // YouTube Upload Settings
    YOUTUBE_UPLOAD_ENABLED: null,
    YOUTUBE_DESCRIPTION: null,
    YOUTUBE_TAGS: null,
    YOUTUBE_CATEGORY: null,
    YOUTUBE_PRIVACY_STATUS: null,
    NEXT_UPLOAD_DATE: null,

    // Story Settings
    STORY_PROFILE: process.env.STORY_PROFILE || "default",
    USE_REDDIT: false,
    USE_FINE_TUNE: false,
    STORY_TITLE_FT_MODEL: null,
    NUM_SCENES: 8,

    // Audio Settings
    VOICE_ID: null,
    BACKGROUND_MUSIC: null,

    // Video Settings
    ORIGINAL_IMAGE: null,
    INTRO_VIDEO: null,
    OUTRO_VIDEO: null,
    USE_PEXELS: null,
    PEXELS_KEYWORDS: null,

    // Subtitle Settings
    ADD_SUBTITLES: null,
    SUBTITLE_STYLE: null,

    // Audio Visualization Settings
    AUDIO_VIZ_CONFIG: null,

    // Thumbnail Settings
    COLOR_METHOD: null,
    THUMBNAIL_FONT: null,
    THUMBNAIL_PRIMARY_COLOR: null,
    THUMBNAIL_SECONDARY_COLOR: null,
    THUMBNAIL_STROKE_COLOR: null,
    THUMBNAIL_STROKE_WIDTH: null,

    // New settings
    OPENROUTER_MODEL_REASONING: process.env.OPENROUTER_MODEL_REASONING || "anthropic/claude-2"
};

// MongoDB connection setup
const uri = 'mongodb+srv://TheRealceCream:xijj69DyfnQOXD9d@cluster0.xvcs7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function getUserSettings(username) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('YouTube-Dashboard');
        const collection = db.collection('everything');

        const document = await collection.findOne({ [username]: { $exists: true } });
        
        if (!document) {
            throw new Error(`No user found with username: ${username}`);
        }

        const userSettings = document[username]['user-settings'];
        
        if (!userSettings) {
            throw new Error(`No settings found for user: ${username}`);
        }

        return userSettings;
    } finally {
        await client.close();
    }
}

async function getChannelSettings(username, channelName) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('YouTube-Dashboard');
        const collection = db.collection('everything');

        console.log(`Searching for username: ${username}, channel: ${channelName}`);

        const document = await collection.findOne({ [username]: { $exists: true } });
        
        if (!document) {
            throw new Error(`No user found with username: ${username}`);
        }

        const channels = document[username].channels;
        if (!channels) {
            throw new Error(`No channels found for user: ${username}`);
        }

        const channelSettings = channels[channelName];
        if (!channelSettings) {
            throw new Error(`No settings found for channel: ${channelName}`);
        }

        return channelSettings;
    } catch (e) {
        console.error(`Error in getChannelSettings: ${e.message}`);
        throw e;
    } finally {
        await client.close();
    }
}

async function initializeSettings(username) {
    console.log("Starting settings initialization...");
    const userSettings = await getUserSettings(username);

    // OpenAI settings
    settings.OAI_API_KEY = userSettings['open-ai']['open-ai-api-key'];
    settings.OR_API_KEY = userSettings['open-router']['open-router-api-key'];
    settings.OR_MODEL = userSettings['open-router']['model'];
    settings.OAI_MODEL = userSettings['open-ai']['model'];
    settings.FT_MODEL = userSettings['open-ai']['ft-model'];

    // ElevenLabs settings
    settings.VOICE_API_KEY = userSettings['elevenlabs']['elab_api_key'];
    settings.VOICE_MODEL = userSettings['elevenlabs']['elab_voice_model'];

    // Replicate settings
    settings.REPLICATE_API_KEY = userSettings['replicate']['replicate-api-key'];

    // Pexels settings
    settings.PEXELS_API_KEY = userSettings['pexels']['pexels-api-key'];

    // Reddit settings
    settings.REDDIT_CLIENT_ID = userSettings['reddit']['reddit-client-id'];
    settings.REDDIT_CLIENT_SECRET = userSettings['reddit']['reddit-client-secret'];
    settings.REDDIT_USER_AGENT = "Reddit posts";

    // AWS settings
    settings.AWS_ACCESS_KEY = userSettings['aws']['aws_access_key'];
    settings.AWS_SECRET_KEY = userSettings['aws']['aws_secret_key'];
    settings.AMI_ID = userSettings['aws']['ami_id'];
    settings.INSTANCE_TYPE = userSettings['aws']['instance_type'];
    settings.BASE_INSTANCE_NAME = userSettings['aws']['base_instance_name'];
    settings.REGION = 'us-east-1';

    console.log("Settings initialization completed");
}

async function initializeChannelSettings(username, channelName) {
    console.log("Initializing channel settings...");
    const channelSettings = await getChannelSettings(username, channelName);
    
    // YouTube Upload Settings
    settings.YOUTUBE_UPLOAD_ENABLED = channelSettings.youtube.upload.enabled;
    settings.YOUTUBE_DESCRIPTION = channelSettings.youtube.upload.description;
    settings.YOUTUBE_TAGS = channelSettings.youtube.upload.tags;
    settings.YOUTUBE_CATEGORY = channelSettings.youtube.upload.category;
    settings.YOUTUBE_PRIVACY_STATUS = channelSettings.youtube.upload.privacy_status;
    settings.NEXT_UPLOAD_DATE = channelSettings.youtube.upload.next_upload_date;

    // Story Settings
    settings.STORY_PROFILE = channelSettings.story.profile;
    settings.USE_REDDIT = channelSettings.story.use_reddit;
    settings.STORY_TITLE_FT_MODEL = channelSettings.story.title_ft_model;
    settings.NUM_SCENES = channelSettings.story.num_scenes;
    settings.USE_FINE_TUNE = channelSettings.story.use_fine_tune;

    // Audio Settings
    settings.VOICE_ID = channelSettings.audio.voice_id;
    settings.BACKGROUND_MUSIC = channelSettings.audio.background_music;

    // Video Settings
    settings.ORIGINAL_IMAGE = channelSettings.video.original_image;
    settings.INTRO_VIDEO = channelSettings.video.intro_video;
    settings.OUTRO_VIDEO = channelSettings.video.outro_video;
    settings.USE_PEXELS = channelSettings.video.use_pexels;
    settings.PEXELS_KEYWORDS = channelSettings.video.pexels_keywords;

    // Subtitle Settings
    settings.ADD_SUBTITLES = channelSettings.subtitles.enabled;
    settings.SUBTITLE_STYLE = channelSettings.subtitles.style;

    // Audio Visualization Settings
    settings.AUDIO_VIZ_CONFIG = channelSettings.audio_visualization;

    // Thumbnail Settings
    settings.COLOR_METHOD = channelSettings.thumbnail.color_method;
    settings.THUMBNAIL_FONT = channelSettings.thumbnail.font;
    settings.THUMBNAIL_PRIMARY_COLOR = channelSettings.thumbnail.primary_color;
    settings.THUMBNAIL_SECONDARY_COLOR = channelSettings.thumbnail.secondary_color;
    settings.THUMBNAIL_STROKE_COLOR = channelSettings.thumbnail.stroke_color;
    settings.THUMBNAIL_STROKE_WIDTH = channelSettings.thumbnail.stroke_width;

    console.log("Channel settings initialization completed");
}

async function loadStoryProfiles() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('YouTube-Dashboard');
        const collection = db.collection('video-types');

        const storyProfiles = await collection.findOne();
        if (!storyProfiles) {
            console.error("Error: No story profiles found in the video-types collection.");
            return {};
        }
        return storyProfiles;
    } catch (e) {
        console.error(`Error: ${e}`);
        return {};
    } finally {
        await client.close();
    }
}

export { initializeSettings, initializeChannelSettings, loadStoryProfiles };
export default settings; 