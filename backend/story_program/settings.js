const { MongoClient } = require('mongodb');
require('dotenv').config();

// General Settings
let settings = {
    // API Keys
    OAI_API_KEY: null,
    OR_API_KEY: null,
    VOICE_API_KEY: null,
    PEXELS_API_KEY: null,
    REPLICATE_API_KEY: null,

    // Reddit Settings
    REDDIT_CLIENT_ID: null,
    REDDIT_CLIENT_SECRET: null,
    REDDIT_USER_AGENT: "Reddit posts",

    // AI Model Settings
    OAI_MODEL: null,
    OR_MODEL: null,
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
    STORY_PROFILE: null,
    USE_REDDIT: null,
    USE_FINE_TUNE: null,
    STORY_TITLE_FT_MODEL: null,
    NUM_SCENES: null,

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
    THUMBNAIL_STROKE_WIDTH: null
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

        // Log the search parameters
        console.log(`Searching for username: ${username}, channel: ${channelName}`);

        const document = await collection.findOne({ [username]: { $exists: true } });
        
        if (!document) {
            throw new Error(`No user found with username: ${username}`);
        }

        // Log the found document structure
        // console.log('Found document structure:', 
        //     JSON.stringify({
        //         username: Object.keys(document[username]),
        //         hasChannels: !!document[username].channels
        //     }, null, 2)
        // );

        const channels = document[username].channels;
        if (!channels) {
            throw new Error(`No channels found for user: ${username}`);
        }

        const channelSettings = channels[channelName];
        if (!channelSettings) {
            throw new Error(`No settings found for channel: ${channelName}`);
        }

        // Log the found channel settings
        //console.log('Found channel settings:', JSON.stringify(channelSettings, null, 2));

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

// Export everything that's needed
module.exports = {
    settings,
    initializeSettings,
    initializeChannelSettings,
    getUserSettings,
    getChannelSettings,
    loadStoryProfiles,
    // Add getters for commonly accessed settings
    get NUM_SCENES() { return settings.NUM_SCENES; },
    get STORY_PROFILE() { return settings.STORY_PROFILE; },
    get USE_REDDIT() { return settings.USE_REDDIT; },
    get USE_FINE_TUNE() { return settings.USE_FINE_TUNE; },
    get OR_MODEL() { return settings.OR_MODEL; },
    get OAI_API_KEY() { return settings.OAI_API_KEY; },
    get OR_API_KEY() { return settings.OR_API_KEY; },
    get REPLICATE_API_KEY() { return settings.REPLICATE_API_KEY; },
    get VOICE_API_KEY() { return settings.VOICE_API_KEY; },
    get VOICE_MODEL() { return settings.VOICE_MODEL; },
    get PEXELS_API_KEY() { return settings.PEXELS_API_KEY; },
    get REDDIT_CLIENT_ID() { return settings.REDDIT_CLIENT_ID; },
    get REDDIT_CLIENT_SECRET() { return settings.REDDIT_CLIENT_SECRET; },
    get REDDIT_USER_AGENT() { return settings.REDDIT_USER_AGENT; },
    get AWS_ACCESS_KEY() { return settings.AWS_ACCESS_KEY; },
    get AWS_SECRET_KEY() { return settings.AWS_SECRET_KEY; },
    get AMI_ID() { return settings.AMI_ID; },
    get INSTANCE_TYPE() { return settings.INSTANCE_TYPE; },
    get BASE_INSTANCE_NAME() { return settings.BASE_INSTANCE_NAME; },
    get REGION() { return settings.REGION; },
    // Channel-specific settings
    get YOUTUBE_UPLOAD_ENABLED() { return settings.YOUTUBE_UPLOAD_ENABLED; },
    get YOUTUBE_DESCRIPTION() { return settings.YOUTUBE_DESCRIPTION; },
    get YOUTUBE_TAGS() { return settings.YOUTUBE_TAGS; },
    get YOUTUBE_CATEGORY() { return settings.YOUTUBE_CATEGORY; },
    get YOUTUBE_PRIVACY_STATUS() { return settings.YOUTUBE_PRIVACY_STATUS; },
    get NEXT_UPLOAD_DATE() { return settings.NEXT_UPLOAD_DATE; },
    get STORY_TITLE_FT_MODEL() { return settings.STORY_TITLE_FT_MODEL; },
    get VOICE_ID() { return settings.VOICE_ID; },
    get BACKGROUND_MUSIC() { return settings.BACKGROUND_MUSIC; },
    get ORIGINAL_IMAGE() { return settings.ORIGINAL_IMAGE; },
    get INTRO_VIDEO() { return settings.INTRO_VIDEO; },
    get OUTRO_VIDEO() { return settings.OUTRO_VIDEO; },
    get USE_PEXELS() { return settings.USE_PEXELS; },
    get PEXELS_KEYWORDS() { return settings.PEXELS_KEYWORDS; },
    get ADD_SUBTITLES() { return settings.ADD_SUBTITLES; },
    get SUBTITLE_STYLE() { return settings.SUBTITLE_STYLE; },
    get AUDIO_VIZ_CONFIG() { return settings.AUDIO_VIZ_CONFIG; },
    get COLOR_METHOD() { return settings.COLOR_METHOD; },
    get THUMBNAIL_FONT() { return settings.THUMBNAIL_FONT; },
    get THUMBNAIL_PRIMARY_COLOR() { return settings.THUMBNAIL_PRIMARY_COLOR; },
    get THUMBNAIL_SECONDARY_COLOR() { return settings.THUMBNAIL_SECONDARY_COLOR; },
    get THUMBNAIL_STROKE_COLOR() { return settings.THUMBNAIL_STROKE_COLOR; },
    get THUMBNAIL_STROKE_WIDTH() { return settings.THUMBNAIL_STROKE_WIDTH; }
}; 