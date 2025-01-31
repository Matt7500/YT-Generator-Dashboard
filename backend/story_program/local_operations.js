const OpenAI = require('openai');
const settings = require('./settings');
const elevenlabs = require('elevenlabs-node');
const Replicate = require('replicate');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const naturalSort = require('natural-compare-lite');
const { createCanvas, loadImage, registerFont } = require('canvas');
const wordwrap = require('word-wrap');

// Add global variables to hold the clients
let oaiClient = null;
let orClient = null;
let replicateClient = null;
let elevenlabsClient = null;

// Get the absolute path to the fonts directory
const FONTS_DIR = path.join(__dirname, 'fonts');

async function initializeClients() {
    try {
        console.log("Initializing API clients...");
        
        console.log("Setting up OpenAI client...");
        oaiClient = new OpenAI({ 
            apiKey: settings.OAI_API_KEY 
        });

        console.log("Setting up OpenRouter client...");
        orClient = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: settings.OR_API_KEY
        });
        
        console.log("Setting up Replicate client...");
        replicateClient = new Replicate({
            auth: settings.REPLICATE_API_KEY
        });
        if (settings.REPLICATE_API_KEY) {
            console.log(`Replicate client initialized with API key: ${settings.REPLICATE_API_KEY.substring(0, 8)}...`);
        } else {
            console.log("Warning: Replicate client initialized with undefined API key");
        }
        
        console.log("Setting up ElevenLabs client...");
        elevenlabsClient = new elevenlabs({
            apiKey: settings.VOICE_API_KEY
        });
        
        console.log("All API clients initialized successfully.");
        
    } catch (error) {
        console.error(`Error initializing clients: ${error.message}`);
        console.error(`Error type: ${error.constructor.name}`);
        console.error(`Stack trace: ${error.stack}`);
        throw error;
    }
}

async function summarizeText(text, storyProfile, { isThumbnail = false, maxRetries = 3, initialDelay = 1 } = {}) {
    /**
     * Summarize text with retry logic for API failures
     */
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // First summary attempt using OpenRouter
            const message = await orClient.chat.completions.create({
                model: settings.OR_MODEL,
                max_tokens: 4000,
                temperature: 0.5,
                messages: [
                    {
                        role: "system",
                        content: "Write a detailed summary of the given story. You must only respond with the summary, do not write any comments."
                    },
                    { role: "user", content: text }
                ]
            });

            if (storyProfile === 'Horror') {
                if (isThumbnail) {
                    // Second summary attempt for thumbnails using OpenAI
                    try {
                        const message2 = await oaiClient.chat.completions.create({
                            model: 'chatgpt-4o-latest',
                            max_tokens: 4000,
                            temperature: 0.7,
                            messages: [
                                {
                                    role: "system",
                                    content: `Write a very short description of a scene that shows what the given story summary is about.
                                    Include the people in the story or the monster/creature in the story as the subject of the scene.
                                    It must describe the scene as it already is. Only write what is in the plot of the story and is important to the plot of the story.
                                    Do not mention any children or people in the description, only describe the setting.
                                    The description must not be nsfw or disturbing.
                                    If there is a creature or entity in crucial to the story then describe that in a location in the story.
                                    If there is a building or a house/cabin the story takes place in then describe that in it's location in the story.
                                    Do not describe any actions in the scene, only describe what is visually there.
                                    The creature/entity or building if exists must be the focus of the description.
                                    Do not include any text in the description.
                                    Do not mention any weapons in the description.
                                    Write this in 20 words or less.
            
                                    ## Examples:
                                    a person sitting on the edge of a bed in a dark concrete room
                                    a young girl standing in a playground at night
                                    a man standing outside a house at night
                                    a scary person in a diner at night
                                    a large sea creature in the dark ocean
                                    a forest ranger standing in front of a large creature at night
                                    an abandoned mansion at night
                                    a cop car in a cornfield at night
                                    a lighthouse on a cliff overlooking the ocean at night
                                    an old graveyard in a forest at night
                                    a wooden fire lookout tower at night
                                    a cabin in the woods in the winter at night`
                                },
                                { role: "user", content: message.choices[0].message.content }
                            ]
                        });
                        return `a grunge digital painting of${message2.choices[0].message.content}, the subject is in the center of the image`;
                    } catch (error) {
                        console.log(`Error in thumbnail summary generation (attempt ${attempt + 1}): ${error.toString()}`);
                        if (attempt < maxRetries - 1) {
                            const waitTime = initialDelay * (2 ** attempt);
                            console.log(`Retrying thumbnail summary in ${waitTime} seconds...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                            continue;
                        }
                        throw error;
                    }
                } else {
                    // Second summary attempt for scenes using OpenAI
                    try {
                        const message2 = await oaiClient.chat.completions.create({
                            model: 'chatgpt-4o-latest',
                            max_tokens: 4000,
                            temperature: 0.7,
                            messages: [
                                {
                                    role: "system",
                                    content: `Write a very short description of a scene that shows what the given scene is about.
                                    Only describe the setting of the scene.

                                    ## Instructions
                                    Do not write any disturbing details such as gore, blood, or violence of any kind.
                                    Do not mention any children or people in the description, only describe the setting.
                                    Do not mention any weapons in the description.
                                    Do not describe any people being injured or killed.
                                    Write this in 20 words or less.
            
                                    ## Examples:
                                    a person sitting on the edge of a bed in a dark concrete room
                                    a young girl standing in a playground at night
                                    a man standing outside a house at night
                                    a scary person in a diner at night
                                    a large sea creature in the dark ocean
                                    a forest ranger standing in front of a large creature at night
                                    an abandoned mansion at night
                                    a cop car in a cornfield at night
                                    a lighthouse on a cliff overlooking the ocean at night
                                    an old graveyard in a forest at night
                                    a wooden fire lookout tower at night
                                    a cabin in the woods in the winter at night`
                                },
                                { role: "user", content: message.choices[0].message.content }
                            ]
                        });
                        return `a film photograph of ${message2.choices[0].message.content}`;
                    } catch (error) {
                        console.log(`Error in scene summary generation (attempt ${attempt + 1}): ${error.toString()}`);
                        if (attempt < maxRetries - 1) {
                            const waitTime = initialDelay * (2 ** attempt);
                            console.log(`Retrying scene summary in ${waitTime} seconds...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                            continue;
                        }
                        throw error;
                    }
                }
            } else {
                const prompt = 'portrait of a beautiful woman in a dress outside centered in the frame';
                return prompt;
            }

        } catch (error) {
            console.log(`Error in initial summary generation (attempt ${attempt + 1}): ${error.toString()}`);
            if (attempt < maxRetries - 1) {
                const waitTime = initialDelay * (2 ** attempt);
                console.log(`Retrying initial summary in ${waitTime} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                continue;
            }
            throw error;
        }
    }

    throw new Error(`Failed to generate summary after ${maxRetries} attempts`);
}

async function generateImg(prompt, { isThumbnail = false, maxRetries = 5, initialDelay = 1 } = {}) {
    if (!replicateClient) {
        throw new Error("Replicate client not initialized");
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const output = await replicateClient.run(
                "black-forest-labs/flux-1.1-pro-ultra",
                {
                    input: {
                        prompt: prompt,
                        aspect_ratio: isThumbnail ? "21:9" : "16:9",
                        output_format: "png",
                        output_quality: 80,
                        safety_tolerance: 5,
                        prompt_upsampling: true
                    }
                }
            );
            return output;

        } catch (error) {
            const waitTime = initialDelay * (2 ** attempt); // Exponential backoff
            if (attempt < maxRetries - 1) {
                console.log(`Attempt ${attempt + 1} failed: ${error.toString()}`);
                console.log(`Retrying in ${waitTime} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            } else {
                console.log(`All ${maxRetries} attempts failed. Last error: ${error.toString()}`);
                throw error;
            }
        }
    }

    throw new Error(`Failed to generate image after ${maxRetries} attempts`);
}

async function saveImage(imageUrl, profileName, { imageType = 'scene', sceneNumber = null } = {}) {
    try {
        // Download the image
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        
        if (response.status === 200) {
            let directory, filename;
            
            // Determine directory and filename based on image type
            if (imageType === 'scene') {
                directory = path.join('Output', profileName, 'scene_images');
                filename = path.join(directory, `scene_${sceneNumber}.png`);
            } else if (imageType === 'thumbnail') {
                directory = path.join('Output', profileName);
                filename = path.join(directory, 'video_background.png');
            } else {
                throw new Error("Invalid image_type. Must be 'scene' or 'thumbnail'.");
            }

            // Create directory if it doesn't exist
            await fs.mkdir(directory, { recursive: true });

            // Load image with Sharp
            let image = sharp(response.data);
            
            // Get image metadata
            const metadata = await image.metadata();
            const aspectRatio = metadata.width / metadata.height;
            
            // First, resize the image to be 1080 pixels tall while maintaining aspect ratio
            const newHeight = 1080;
            const newWidth = Math.round(newHeight * aspectRatio);
            
            image = image.resize(newWidth, newHeight, {
                kernel: sharp.kernel.lanczos3,
                fit: 'fill'
            });

            if (imageType === 'thumbnail') {
                // For thumbnails, calculate the crop after resizing
                const targetRatio = 1920 / 1080;
                const cropWidth = Math.round(newHeight * targetRatio);
                
                if (newWidth > cropWidth) {
                    // If image is wider than needed, crop from right side
                    image = image.extract({
                        left: 0,
                        top: 0,
                        width: cropWidth,
                        height: newHeight
                    });
                } else {
                    // If image is not wide enough, resize to exact dimensions
                    image = sharp(response.data)
                        .resize(1920, 1080, {
                            kernel: sharp.kernel.lanczos3,
                            fit: 'fill'
                        });
                }
            } else {
                // For scene images, resize to exact dimensions
                image = sharp(response.data)
                    .resize(1920, 1080, {
                        kernel: sharp.kernel.lanczos3,
                        fit: 'fill'
                    });
            }

            // Save the image
            await image.png().toFile(filename);
            
            return filename;
        } else {
            const errorMessage = imageType === 'scene' 
                ? `Failed to download the image for scene ${sceneNumber}`
                : 'Failed to download the image for thumbnail';
            console.log(errorMessage);
            return null;
        }
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
}

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function combineAudio(profileName, sceneNumber) {
    try {
        const audiofilesDir = path.join('Output', profileName, 'audiofiles', `scene_${sceneNumber}`);
        
        // Get a sorted list of all audio files in the directory
        const files = await fs.readdir(audiofilesDir);
        const audioFiles = files.sort(naturalSort);

        // Create output path
        const outputAudioPath = path.join('Output', profileName, `Scene_${sceneNumber}.mp3`);

        // Create a new ffmpeg command
        let command = ffmpeg();

        // Add all audio files to the command
        for (const audioFile of audioFiles) {
            command = command.input(path.join(audiofilesDir, audioFile));
        }

        // Get duration promise
        const getDuration = () => {
            return new Promise((resolve, reject) => {
                ffmpeg.ffprobe(outputAudioPath, (err, metadata) => {
                    if (err) reject(err);
                    else resolve(metadata.format.duration * 1000); // Convert to milliseconds
                });
            });
        };

        // Return promise for concatenation
        return new Promise((resolve, reject) => {
            command
                .complexFilter([{
                    filter: 'concat',
                    options: {
                        n: audioFiles.length,
                        v: 0,
                        a: 1
                    }
                }])
                .on('end', async () => {
                    try {
                        // Get duration of final file
                        const duration = await getDuration();
                        
                        // Remove the audiofiles directory and its contents
                        await fs.rm(audiofilesDir, { recursive: true, force: true });
                        
                        resolve([outputAudioPath, duration]);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (err) => {
                    console.error('Error:', err);
                    reject(err);
                })
                .save(outputAudioPath);
        });
    } catch (error) {
        console.error('Error combining audio files:', error);
        throw error;
    }
}

async function drawTextOnImage(imagePath, text, outputPath, profile) {
    // Convert the text to uppercase
    text = text.toUpperCase();

    // Split the text into two parts
    let beforeSplit, afterSplit;
    if (text.includes(',')) {
        // Split after the last comma
        [beforeSplit, afterSplit] = text.split(/,(?=[^,]*$)/);
        beforeSplit += ',';
    } else if (text.includes('.')) {
        [beforeSplit, afterSplit] = text.split('. ', 2);
    } else if (text.includes(' AND ')) {
        [beforeSplit, afterSplit] = text.split(' AND ', 2);
        afterSplit = 'AND ' + afterSplit;
    } else if (text.includes(' THAT ')) {
        [beforeSplit, afterSplit] = text.split(' THAT ', 2);
        afterSplit = 'THAT ' + afterSplit;
    } else {
        beforeSplit = text;
        afterSplit = '';
    }

    // Load the image and get dimensions
    const image = await sharp(imagePath);
    const metadata = await image.metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    // Define the bounding box
    const leftPadding = 60;  // Increased left padding
    const topPadding = Math.floor(imgHeight * 0.3);  // Start text 30% down from top
    const bottomPadding = 100;
    const boxWidth = Math.floor(imgWidth * 0.7) - leftPadding;
    const maxHeight = imgHeight - topPadding - bottomPadding;

    // Create canvas for text measurements and drawing
    const canvas = createCanvas(imgWidth, imgHeight);
    const ctx = canvas.getContext('2d');

    // Register and load font
    const fontPath = path.join(FONTS_DIR, profile.thumbnail.font);
    registerFont(fontPath, { family: 'CustomFont' });

    // Find appropriate font size
    let fontSize = 200;  // Start with slightly smaller max font size
    let textHeight;
    let wrappedBeforeSplit;
    let wrappedAfterSplit;
    
    do {
        ctx.font = `${fontSize}px CustomFont`;
        
        // Calculate characters per line based on box width
        const charWidth = ctx.measureText('A').width;
        const charsPerLine = Math.floor(boxWidth / charWidth);
        
        // Wrap text with proper line breaks
        wrappedBeforeSplit = wordwrap(beforeSplit, { width: charsPerLine, indent: '' });
        wrappedAfterSplit = afterSplit ? wordwrap(afterSplit, { width: charsPerLine, indent: '' }) : '';
        
        // Split into lines to measure height properly
        const beforeLines = wrappedBeforeSplit.split('\n');
        const afterLines = wrappedAfterSplit ? wrappedAfterSplit.split('\n') : [];
        
        // Calculate total height including line spacing
        const lineHeight = fontSize * 1.2;  // Add 20% line spacing
        textHeight = (beforeLines.length + afterLines.length) * lineHeight;
        
        fontSize -= 2;  // Decrease by 2 for smoother sizing
    } while (textHeight > maxHeight && fontSize > 40);  // Increased minimum font size

    // Set final font
    ctx.font = `${fontSize}px CustomFont`;
    const lineHeight = fontSize * 1.2;

    // Calculate starting Y position to vertically center within the allowed area
    let y = topPadding;
    const totalLines = wrappedBeforeSplit.split('\n').length + (wrappedAfterSplit ? wrappedAfterSplit.split('\n').length : 0);
    const totalTextHeight = totalLines * lineHeight;
    
    // Create shadow layer
    const shadowCanvas = createCanvas(imgWidth, imgHeight);
    const shadowCtx = shadowCanvas.getContext('2d');
    shadowCtx.font = ctx.font;

    // Draw shadow text
    const shadowOffset = 5;
    shadowCtx.fillStyle = 'black';
    
    // Draw before split shadow
    let currentY = y;
    wrappedBeforeSplit.split('\n').forEach(line => {
        shadowCtx.fillText(line, leftPadding + shadowOffset, currentY + shadowOffset);
        currentY += lineHeight;
    });

    // Draw after split shadow
    if (afterSplit) {
        wrappedAfterSplit.split('\n').forEach(line => {
            shadowCtx.fillText(line, leftPadding + shadowOffset, currentY + shadowOffset);
            currentY += lineHeight;
        });
    }

    // Apply gaussian blur to shadow
    const shadowBuffer = await sharp(shadowCanvas.toBuffer())
        .blur(30)
        .toBuffer();

    // Draw main text with stroke
    const strokeWidth = 8;
    const strokeOffsets = [
        [strokeWidth, strokeWidth],
        [-strokeWidth, -strokeWidth],
        [strokeWidth, -strokeWidth],
        [-strokeWidth, strokeWidth]
    ];

    // Draw strokes for before split
    currentY = y;
    wrappedBeforeSplit.split('\n').forEach(line => {
        // Draw strokes
        ctx.fillStyle = 'black';
        for (const [offsetX, offsetY] of strokeOffsets) {
            ctx.fillText(line, leftPadding + offsetX, currentY + offsetY);
        }
        // Draw main text
        ctx.fillStyle = profile.thumbnail.primary_color;
        ctx.fillText(line, leftPadding, currentY);
        currentY += lineHeight;
    });

    // Draw after split if it exists
    if (afterSplit) {
        wrappedAfterSplit.split('\n').forEach(line => {
            // Draw strokes
            ctx.fillStyle = 'black';
            for (const [offsetX, offsetY] of strokeOffsets) {
                ctx.fillText(line, leftPadding + offsetX, currentY + offsetY);
            }
            // Draw main text
            ctx.fillStyle = profile.thumbnail.secondary_color;
            ctx.fillText(line, leftPadding, currentY);
            currentY += lineHeight;
        });
    }

    // Combine everything
    const finalImage = await sharp(imagePath)
        .composite([
            { input: shadowBuffer, blend: 'over' },
            { input: canvas.toBuffer(), blend: 'over' }
        ])
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toBuffer();

    // Save with quality optimization
    let quality = 100;
    const maxFileSize = 1.5 * 1024 * 1024; // 1.5MB

    do {
        await sharp(finalImage)
            .jpeg({ quality })
            .toFile(outputPath);
        
        const stats = fsSync.statSync(outputPath);
        if (stats.size <= maxFileSize || quality <= 10) break;
        
        quality -= 5;
    } while (true);

    console.log(`Image saved at ${outputPath} with final quality: ${quality}`);
}

const readline = require('readline');

function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

async function createTitles(storyText, finetuneModel, maxRetries = 10) {
    /**
     * Create a title with retry logic to ensure it meets criteria:
     * - Must be between 70 and 100 characters
     * - Must include a comma
     */
    const rl = createReadlineInterface();

    try {
        while (true) { // Keep generating titles until user accepts one
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const title = await oaiClient.chat.completions.create({
                        model: finetuneModel,
                        max_tokens: 4000,
                        messages: [
                            {
                                role: "system",
                                content: "You are tasked with creating a YouTube title for the given story. The title must be between 70 and 100 characters and include a comma. The title must be told in first person in the past tense."
                            },
                            {
                                role: "user",
                                content: storyText
                            }
                        ]
                    });

                    let titleText = title.choices[0].message.content.replace(/"/g, '');

                    // Add comma if missing (for horror stories)
                    if (storyText.includes('Horror') && !titleText.includes(',')) {
                        titleText = titleText.replace(' ', ', ', 1); // Add a comma after the first space
                    }

                    // Check if title meets all criteria
                    if (titleText.length <= 100 && titleText.length >= 70 && titleText.includes(',')) {
                        // Use ANSI escape codes for red text
                        console.log(`\x1b[91mGenerated title: ${titleText}`);
                        
                        // Create promise for user input
                        const userInput = await new Promise(resolve => {
                            rl.question('\x1b[91mAccept this title? (y/n): \x1b[0m', answer => {
                                resolve(answer.toLowerCase());
                            });
                        });

                        if (userInput === 'y') {
                            console.log(`Title accepted: ${titleText}`);
                            return titleText;
                        } else {
                            console.log("Generating new title...");
                            break; // Break inner loop to generate new title
                        }
                    } else {
                        const issues = [];
                        if (titleText.length > 100) {
                            issues.push("too long");
                        }
                        if (!titleText.includes(',')) {
                            issues.push("missing comma");
                        }
                        console.log(`Title invalid (${issues.join(', ')}) on attempt ${attempt + 1}, retrying...`);
                    }

                    // If we've exhausted maxRetries without finding a valid title
                    if (attempt === maxRetries - 1) {
                        console.log(`Warning: Could not generate valid title after ${maxRetries} attempts. Truncating...`);
                        return titleText.slice(0, 97) + "...";
                    }

                } catch (error) {
                    console.error(`Error on attempt ${attempt + 1}:`, error);
                    if (attempt === maxRetries - 1) {
                        throw error;
                    }
                }
            }
        }
    } finally {
        rl.close();
    }
}

async function cropImage(inputPath, outputPath) {
    try {
        // Get image metadata
        const metadata = await sharp(inputPath).metadata();
        
        // Target dimensions
        const targetWidth = 1920;
        const targetHeight = 1080;

        // Calculate aspect ratios
        const imgAspect = metadata.width / metadata.height;
        const targetAspect = targetWidth / targetHeight;

        let newWidth, newHeight, left, top;

        if (imgAspect > targetAspect) {
            // Image is wider than target, crop width
            newHeight = metadata.height;
            newWidth = Math.round(newHeight * targetAspect);
            
            // Calculate crop position (center)
            left = Math.floor((metadata.width - newWidth) / 2);
            top = 0;
        } else {
            // Image is taller than target, crop height
            newWidth = metadata.width;
            newHeight = Math.round(newWidth / targetAspect);
            
            // Calculate crop position (center)
            left = 0;
            top = Math.floor((metadata.height - newHeight) / 2);
        }

        await sharp(inputPath)
            .extract({
                left: left,
                top: top,
                width: newWidth,
                height: newHeight
            })
            .resize(targetWidth, targetHeight, {
                kernel: sharp.kernel.lanczos3
            })
            .toFile(outputPath);

        console.log(`Image cropped and resized to 1920x1080 at ${outputPath}`);
    } catch (error) {
        console.error('Error cropping image:', error);
        throw error;
    }
}

/**
 * Create thumbnail with channel-specific settings
 * @param {string} title - The title text to draw
 * @param {string} channelName - The channel name
 * @param {string} backgroundImage - Path to background image
 * @param {string} username - The username
 * @returns {Promise<string>} The path to the created thumbnail
 */
async function createThumbnail(title, channelName, backgroundImage, username) {
    // No need to get channel settings separately as they're already initialized
    const thumbnailOutputPath = path.join('Output', channelName, 'thumbnail.png');

    if (settings.COLOR_METHOD === 'after_punctuation') {
        await drawTextOnImage(
            backgroundImage,
            title,
            thumbnailOutputPath,
            {
                thumbnail: {
                    font: settings.THUMBNAIL_FONT,
                    primary_color: settings.THUMBNAIL_PRIMARY_COLOR,
                    secondary_color: settings.THUMBNAIL_SECONDARY_COLOR,
                    stroke_color: settings.THUMBNAIL_STROKE_COLOR,
                    stroke_width: settings.THUMBNAIL_STROKE_WIDTH
                }
            }
        );
    } else {
        await drawTextOnImageWithSettings(
            backgroundImage,
            title,
            thumbnailOutputPath,
            {
                thumbnail: {
                    font: settings.THUMBNAIL_FONT,
                    primary_color: settings.THUMBNAIL_PRIMARY_COLOR,
                    secondary_color: settings.THUMBNAIL_SECONDARY_COLOR,
                    stroke_color: settings.THUMBNAIL_STROKE_COLOR,
                    stroke_width: settings.THUMBNAIL_STROKE_WIDTH,
                    color_method: settings.COLOR_METHOD
                }
            }
        );
    }

    console.log(`Thumbnail saved to ${thumbnailOutputPath}`);
    return thumbnailOutputPath;
}

/**
 * Process local assets for video creation
 * @param {string} username - The username
 * @param {string} channelName - The channel name
 * @param {Object} options - Optional parameters
 * @param {string} [options.storyText] - The story text
 * @param {Array} [options.scenes] - Array of scenes
 * @param {string} [options.storyIdea] - The story idea
 * @param {boolean} [options.useExistingAudio=false] - Whether to use existing audio
 */
async function processLocal(username, channelName, {
    storyText = null,
    scenes = null,
    storyIdea = null,
    useExistingAudio = false
} = {}) {
    console.log("Starting local processing...");
    
    // Initialize settings and clients
    await settings.initializeSettings(username);
    await settings.initializeChannelSettings(username, channelName);
    await initializeClients(username);

    // Create title using channel's fine-tuned model
    let title = await createTitles(storyIdea, settings.STORY_TITLE_FT_MODEL);
    title = title.replace(/"/g, '');
    console.log(`Video Title: ${title}`);

    // Generate thumbnail image
    const thumbnailSummary = await summarizeText(storyText, settings.STORY_PROFILE, { isThumbnail: true });
    const thumbnailImageUrl = await generateImg(thumbnailSummary, { isThumbnail: true });
    const thumbnailBgPath = await saveImage(thumbnailImageUrl, channelName, { imageType: 'thumbnail' });

    // Create thumbnail using channel settings
    const thumbnailPath = await createThumbnail(title, channelName, thumbnailBgPath, username);

    // Use video_background.png for all scenes
    const sceneImages = Array(scenes.length).fill(path.join('Output', channelName, 'video_background.png'));

    // Process each scene
    const sceneAudioFiles = [];
    const sceneDurations = [];
    const finalAudioPath = path.join('Output', channelName, 'Final.mp3');

    if (!useExistingAudio) {
        console.log("\nProcessing scenes...");
        
        // Process scenes with progress bar
        for (const [index, scene] of scenes.entries()) {
            process.stdout.write(`Processing Scene ${index + 1}/${scenes.length}\r`);
            
            const [audioFile, duration] = await generateTts(
                scene,
                settings.VOICE_ID,
                channelName,
                index + 1
            );
            
            sceneAudioFiles.push(audioFile);
            sceneDurations.push(duration);
        }
        console.log(); // New line after progress

        // Combine audio files
        let finalAudio = await AudioSegment.empty();
        const silence = await AudioSegment.silent(600);
        
        for (const audioFile of sceneAudioFiles) {
            const audioSegment = await AudioSegment.fromFile(audioFile);
            finalAudio = await finalAudio.append(audioSegment);
            finalAudio = await finalAudio.append(silence);
        }

        // Remove last silence
        finalAudio = await finalAudio.slice(0, -600);
        
        // Export final audio
        await finalAudio.export(finalAudioPath, { format: 'mp3' });
    } else {
        console.log("\nUsing existing Final.mp3 file...");
        
        if (!existsSync(finalAudioPath)) {
            throw new Error(`Could not find existing audio file at ${finalAudioPath}`);
        }
        
        // Calculate duration from existing file
        const audio = await AudioSegment.fromFile(finalAudioPath);
        sceneDurations.push(audio.duration); // Total duration in milliseconds
        sceneAudioFiles.push(finalAudioPath);
    }

    console.log("Local processing completed.");
    
    return {
        sceneImages,
        sceneAudioFiles,
        sceneDurations,
        finalAudioPath,
        thumbnailPath,
        title
    };
}

module.exports = {
    initializeClients,
    summarizeText,
    generateImg,
    saveImage,
    combineAudio,
    drawTextOnImage,
    cropImage,
    createTitles,
    createThumbnail,
    processLocal,

    // Export clients for use in other functions
    getOAIClient: () => oaiClient,
    getORClient: () => orClient,
    getReplicateClient: () => replicateClient,
    getElevenLabsClient: () => elevenlabsClient
};