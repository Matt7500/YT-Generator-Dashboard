import { FixedSizeQueue } from '../../utils/utils.js';
import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Helper functions
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function formatScenes(inputString) {
    try {
        // Clean up the input string
        // Remove markdown code block markers and 'json' language identifier
        inputString = inputString.replace(/```json\s*|\s*```/g, '');
        
        // Remove any leading/trailing whitespace
        inputString = inputString.trim();
        
        // Try to parse the input as JSON
        const scenes = JSON.parse(inputString);
        
        const formattedScenes = [];
        
        // Process each scene in the JSON array
        for (const scene of scenes) {
            const sceneNumber = scene.scene_number;
            const sceneBeat = scene.scene_beat;
            
            if (sceneNumber != null && sceneBeat) {
                formattedScenes.push(`${sceneBeat.trim()}`);
            }
        }
        
        if (formattedScenes.length === 0) {
            console.log("Warning: No scenes were parsed from the JSON");
            return null;
        }
            
        return formattedScenes;
        
    } catch (e) {
        if (e instanceof SyntaxError) {
            console.log(`Warning: Failed to parse JSON (${e.toString()})`);
            
            try {
                // Try to clean up the JSON string more aggressively
                // Remove all newlines and extra spaces between JSON objects
                let cleanedInput = inputString.replace(/\s+/g, ' ');
                cleanedInput = cleanedInput.replace(/,\s*]/g, ']');
                
                const scenes = JSON.parse(cleanedInput);
                const formattedScenes = [];
                
                for (const scene of scenes) {
                    const sceneNumber = scene.scene_number;
                    const sceneBeat = scene.scene_beat;
                    
                    if (sceneNumber != null && sceneBeat) {
                        formattedScenes.push(`${sceneBeat.trim()}`);
                    }
                }
                
                if (formattedScenes.length === 0) {
                    console.log("Warning: No scenes were parsed from the cleaned JSON");
                    return null;
                }
                    
                return formattedScenes;
                
            } catch (e) {
                console.log(`Error: Failed to parse JSON even after cleanup: ${e.toString()}`);
                return null;
            }
        }
        return null;
    }
}

let oaiClient = null;
let orClient = null;
let reddit = null;

const settingsObj = {
    OAI_API_KEY: process.env.OPENAI_API_KEY,
    OR_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENROUTER_MODEL_REASONING: process.env.OPENROUTER_MODEL_REASONING,
    TITLES_FT_MODEL: process.env.TITLES_FT_MODEL,
    STORY_PROFILE: 'Horror'
};


const previousScenes = new FixedSizeQueue(4);

async function loadStoryProfiles() {
    try {
        // Get the directory path of the current module
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        
        // Read and parse the profiles.json file
        const profilesPath = join(__dirname, 'profiles.json');
        const profilesData = await readFile(profilesPath, 'utf8');
        const profiles = JSON.parse(profilesData);
        
        return profiles.categories;
    } catch (error) {
        console.error('Error loading story profiles:', error);
        throw error;
    }
}

async function initializeClients() {
    /**
     * Initialize API clients with credentials
     */
    const apiKey = settingsObj.OAI_API_KEY;

    if (!apiKey) {
        throw new Error("OpenAI API key is empty or None");
    }

    // Initialize OpenAI client
    try {
        oaiClient = new OpenAI({ apiKey: apiKey });
        console.log("OpenAI client initialized successfully");
    } catch (e) {
        console.log(`Error initializing OpenAI client: ${e.toString()}`);
        throw e;
    }

    // Initialize OpenRouter client
    try {
        if (settingsObj.OR_API_KEY) {
            orClient = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: settingsObj.OR_API_KEY
            });
            console.log("OpenRouter client initialized successfully");
        } else {
            orClient = null;
            console.log("Skipping OpenRouter client initialization (no API key)");
        }
    } catch (e) {
        console.log(`Error initializing OpenRouter client: ${e.toString()}`);
        orClient = null;
    }

    console.log("Client initialization completed");
}

async function storyIdeas() {
    // Get the story profile name from the settings
    const storyProfileName = settingsObj.STORY_PROFILE;
    
    // Get the corresponding story profile
    try {
        const allStoryProfiles = await loadStoryProfiles();
        const storyProfile = allStoryProfiles.find(profile => profile.name === storyProfileName);
        
        if (!storyProfile) {
            console.log(`Error: Story profile '${storyProfileName}' not found`);
            return null;
        }

        // Select a random prompt
        const prompt = storyProfile.prompts[Math.floor(Math.random() * storyProfile.prompts.length)];
        console.log(`\n\nUsing prompt: ${prompt}\n\n`);
        
        const message = await oaiClient.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                {
                    role: "system",
                    content: storyProfile.system_prompt
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        
        return message.choices[0].message.content;

    } catch (e) {
        console.log(`Error generating story idea: ${e.toString()}`);
        return null;
    }
}

async function createOutline(idea, num = 12) {
    num = Math.floor(Math.random() * (10 - 6) + 6); // random number between 6 and 9

    let retries = 0;
    while (retries < 5) {
        try {
            const message = await oaiClient.chat.completions.create({
                model: 'gpt-4o-2024-11-20',
                temperature: 1,
                messages: [
                    {
                        role: "user", 
                        content: `## Instructions
                        
                        Write a full plot outline for the given story idea.
                        Write the plot outline as a list of all the scenes in the story. Each scene must be a highly detailed paragraph on what happens in that scene.
                        Each scene beat must include as much detail as you can about the events that happen in the scene.
                        Explicitly state the change of time between scenes if necessary.
                        Mention any locations by name.
                        Create a slow build up of tension and suspense throughout the story.
                        A scene in the story is defined as when there is a change in the setting in the story.
                        The plot outline must contain ${num} scenes.
                        The plot outline must follow and word things in a way that are from the protagonist's perspective, do not write anything from an outside character's perspective that the protagonist wouldn't know.
                        Only refer to the protagonist in the story as "The Protagonist" in the plot outline.
                        Each scene must smoothly transition from the previous scene and to the next scene without unexplained time and setting jumps.
                        Ensure key story elements (e.g., character motivations, mysteries, and plot developments) are resolved by the end.
                        Explicitly address and resolve the purpose and origin of central objects or plot devices (e.g., mysterious items, symbols, or events).
                        If other characters have significant knowledge of the mystery or key events, show how and when they gained this knowledge to maintain logical consistency.
                        Explore and resolve character dynamics, especially those affecting key relationships (e.g., family tension or conflicts).
                        Provide clarity on thematic or mysterious elements that connect scenes, ensuring the stakes are clearly defined and resolved.
                        The final scene beat must state it's the final scene beat of the story and how to end the story.


                        ## You must use following json format for the plot outline exactly without deviation:
                        [
                            {"scene_number": 1, "scene_beat": "<Write the first scene beat here>"},
                            {"scene_number": 2, "scene_beat": "<Write the second scene beat here>"},
                            {"scene_number": 3, "scene_beat": "<Write the third scene beat here>"},
                            {"scene_number": 4, "scene_beat": "<Write the fourth scene beat here>"},
                            {"scene_number": 5, "scene_beat": "<Write the fifth scene beat here>"},
                            {"scene_number": 6, "scene_beat": "<Write the sixth scene beat here>"},
                            {"scene_number": 7, "scene_beat": "<Write the seventh scene beat here>"},
                            {"scene_number": 8, "scene_beat": "<Write the eighth scene beat here>"},
                            {"scene_number": 9, "scene_beat": "<Write the ninth scene beat here>"},
                            {"scene_number": 10, "scene_beat": "<Write the tenth scene beat here>"},
                            {"scene_number": 11, "scene_beat": "<Write the eleventh scene beat here>"},
                            {"scene_number": 12, "scene_beat": "<Write the twelfth scene beat here>"}
                        ]
                        \n\n## Story Idea:\n${idea}`
                    }
                ]
            });

            console.log(message.choices[0].message.content);

            const outline = formatScenes(message.choices[0].message.content);
            
            if (!outline) {
                console.log("Error: Empty outline generated.");
                retries++;
                continue;
            }

            return outline;
        } catch (e) {
            console.log(`Error in createOutline: ${e}. Retrying...`);
            retries++;
        }
    }

    console.log("Failed to create outline after 5 attempts.");
    return null;
}

async function characters(outline) {
    let retries = 0;
    while (retries < 10) {
        try {
            const message = await orClient.chat.completions.create({
                model: settingsObj.OR_MODEL,
                max_tokens: 4000,
                temperature: 0.7,
                messages: [

                    {
                        role: "user", 
                        content: `## Instructions
                        
                        Using the given story outline, write short character descriptions for all the characters in the story in the following format:
                        <character name='(Character Name)' aliases='(Character Alias)' pronouns='(Character Pronouns)'>(Character description)</character>

                        The character alias is what the other characters in the story will call that character in the story such as their first name.
                        For the Protagonist's alias you must create a name that other characters will call them in the story.
                        The character pronouns are the pronouns that the character uses for themselves.
                        The character description must only describe their appearance and their personality DO NOT write what happens to them in the story.
                        Only return the character descriptions without any comments.
        
                        ## Outilne:\n\n${outline}`
                    }
                ]
            });
            return message.choices[0].message.content;
        } catch (e) {
            console.log(`Error: ${e}. Retrying...`);
            retries++;
        }
    }
}

async function createTitle(storyText, maxRetries = 10) {
    /**
     * Create a title with retry logic to ensure it meets criteria:
     * - Must be between 50 and 100 characters
     * - Must include a comma
     */
    const rl = createReadlineInterface();

    try {
        while (true) { // Keep generating titles until user accepts one
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const title = await oaiClient.chat.completions.create({
                        model: TITLES_FT_MODEL,
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
                    if (titleText.length <= 100 && titleText.length >= 50 && titleText.includes(',')) {
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

async function testLoadProfiles() {
    try {
        const profiles = await loadStoryProfiles();
        console.log('Available Categories:');
        profiles.forEach(profile => {
            console.log(`- ${profile.name} (${profile.prompts.length} prompts)`);
        });
        console.log('\nFirst prompt from each category:');
        profiles.forEach(profile => {
            console.log(`\n${profile.name}:`);
            console.log(profile.prompts[0].substring(0, 150) + '...');
        });
    } catch (error) {
        console.error('Test failed:', error);
    }
}

async function testFullPipeline() {
    try {
        // 1. Initialize clients
        console.log('\n1. Initializing clients...');
        await initializeClients();

        // 2. Load profiles
        console.log('\n2. Loading story profiles...');
        const profiles = await loadStoryProfiles();
        console.log('Available Categories:');
        profiles.forEach(profile => {
            console.log(`- ${profile.name} (${profile.prompts.length} prompts)`);
        });

        // 3. Generate story idea
        console.log('\n3. Generating story idea...');
        const storyIdea = await storyIdeas();
        console.log('\nGenerated Story Idea:');
        console.log(storyIdea);

        // 4. Create outline
        console.log('\n4. Creating story outline...');
        const outline = await createOutline(storyIdea);
        console.log('\nGenerated Outline:');
        console.log(outline);

        // 5. Generate characters
        console.log('\n5. Generating characters...');
        const chars = await characters(outline);
        console.log('\nGenerated Characters:');
        console.log(chars);

        // 6. Create title
        console.log('\n6. Creating title...');
        const title = await createTitle(storyIdea);
        console.log('\nFinal Title:');
        console.log(title);

    } catch (error) {
        console.error('Pipeline test failed:', error);
    }
}

// Run test if file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testFullPipeline();
}

export { initializeClients, storyIdeas, createOutline, createTitle, characters };