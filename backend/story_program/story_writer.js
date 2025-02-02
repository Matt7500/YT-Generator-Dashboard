import fs from 'fs/promises';
import OpenAI from 'openai';
import settings from './settings.js';
import { FixedSizeQueue } from './utils.js';

// Add global variables to hold the clients
let oaiClient = null;
let orClient = null;
let reddit = null;

// Queue to store previous scenes for context
const previousScenes = new FixedSizeQueue(4);

async function initializeClients() {
    /**
     * Initialize API clients with credentials
     */
    const apiKey = settings.OAI_API_KEY;

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
        if (settings.OR_API_KEY) {
            orClient = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: settings.OR_API_KEY
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

async function writeDetailedSceneDescription(scene) {
    const prompt = `
    Analyze the following scene and provide a highly detailed paragraph focusing on the most important details and events that are crucial to the story.
    You must include every single detail exactly that is most important to the plot of the story.
    
    Be as detailed as possible with your description of the events in the scene, your description must be at least 200 words.
    Do not write any comments, only return the description.

    Scene:
    ${scene}

    Provide the description as a structured text, not in JSON format.
    `;

    let retries = 0;
    while (retries < 5) {
        try {
            const response = await orClient.chat.completions.create({
                model: settings.OR_MODEL,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
            });
            return response.choices[0].message.content;
        } catch (e) {
            console.log(`Error ${e}. Retrying...`);
            retries++;
        }
    }
}

async function checkSceneConsistency(newSceneDescription, previousScenes) {
    const prompt = `
    You are an expert story editor, compare the new scene with the previous scenes and identify any continuity errors that are crucial to the progression the story.
    
    ## Ignore new elements or changes if they make sense in the context of the story progressing, do not label something an error just because it's different from the previous scene.

    You must make sure the beginning of the scene flows smoothly with the previous scene seamlessly.

    ##Only provide fixes that can be fixed in the given scene, do not provide fixes that are for anything that could be fixed in a previous scene.


    Only write the most important continuity errors about the plot, characters, and story timeline.
    Ignore any minor continuity errors that are there for the progression of the story or are minor details in the story that aren't important, you are only looking for the most important details that are crucial to the plot of the story.
    Only respond with the list of continuity errors, do not write any comments.
    If you find no continuity errors with the previous scenes then only respond with: No Continuity Errors Found.

    New scene:
    ${newSceneDescription}

    Previous scenes (most recent 4):
    ${previousScenes.join(' ')}

    Provide the continuity errors as a list in order of importance to the story. Describe how to fix those errors in the scene.
    `;

    const response = await orClient.chat.completions.create({
        model: settings.OPENROUTER_MODEL_REASONING,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
    });

    console.log(`########### Errors #############\n\n${response.choices[0].message.content}\n\n##############################`);
    return response.choices[0].message.content;
}

async function rewriteScene(originalScene, sceneBeat, inconsistencies) {
    console.log("Rewriting scene to address inconsistencies...");
    const prompt = `
    Rewrite the following scene to address the identified inconsistencies while maintaining the original scene beat. Focus on fixing the most important inconsistencies first.

    Original scene:
    ${originalScene}

    Scene beat:
    ${sceneBeat}

    Issues to address:
    ${inconsistencies}

    Rewrite the scene to maintain story continuity and address these issues. Make sure to resolve ALL inconsistencies in your rewrite.
    The rewrite should maintain the same general length and level of detail as the original scene.
    `;

    const response = await orClient.chat.completions.create({
        model: settings.OPENROUTER_MODEL_REASONING,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
    });

    console.log("Scene rewritten.");
    return response.choices[0].message.content;
}

async function writeScene(sceneBeat, characters, num, totalScenes) {
    console.log(`Writing scene ${num + 1} of ${totalScenes}\n\n${sceneBeat}\n\n`);
    // Get only the 4 most recent scenes for context
    const recentContext = previousScenes.items.slice(-2) || ["No previous context. This is the first scene."];
    const context = recentContext.join('\n\n');

    const finalSceneIndicator = num === totalScenes - 1 
        ? 'This is the final scene of the story. You must write an ending to the story that nicely ends the story explicitly, do not end it in the middle of a scene or event. Do not write "The End" or anything like that.' 
        : '';

    const prompt = `
    ## SCENE CONTEXT AND CONTINUITY
    # Characters
    ${characters}
    
    # Use the provided STORY CONTEXT to remember details and events from the previous scenes in order to maintain consistency in the new scene you are writing.
    ## STORY CONTEXT
    ${context}
    
    # Scene Beat to Write
    ${sceneBeat}

    ## WRITING INSTRUCTIONS
    You are an expert fiction writer. Write a fully detailed scene as long as you need to without overwriting that flows naturally from the previous events described in the context.
    ${finalSceneIndicator}

    # Core Requirements
    - Write from first-person narrator perspective only
    - Begin with a clear connection to the previous scene's ending
    - Include full, natural dialogue
    - Write the dialogue in their own paragraphs, do not include the dialogue in the same paragraph as the narration.
    - Write everything that the narrator sees, hears, and everything that happens in the scene.
    - Write the entire scene and include everything in the scene beat given, do not leave anything out.
    
    # Pacing and Suspense
    - Maintain steady, escalating suspense
    - Use strategic pauses and silence for impact
    - Build tension in small, deliberate increments
    - Balance action with reflection

    # Writing Style
    - Use concise, sensory-rich language
    - Vary sentence length based on tension:
        * Shorter sentences for action/tension
        * Longer sentences for introspection
    - Show emotions through implications rather than stating them
    
    # Scene Structure
    - Write tight, focused paragraphs
    - Layer the scene from normal to unsettling
    - Break up dialogue with introspection and description
    - Include moments of dark humor sparingly
    - Allow for natural processing of events
    `;
    
    let retries = 0;
    while (retries < 5) {
        try {
            const response = await orClient.chat.completions.create({
                model: settings.OR_MODEL,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 8000,
            });

            let writtenScene = response.choices[0].message.content
                .replace(/\*/g, '')
                .replace(/---\n/g, '')
                .replace(/\n\n---/g, '');
            
            // Check if scene is too short (less than 500 characters)
            if (writtenScene.trim().length < 500) {
                console.log(`Scene too short (${writtenScene.trim().length} chars). Retrying...`);
                retries++;
                continue;
            }
                
            console.log(writtenScene);
            
            // Add scene consistency check with verification loop
            const maxAttempts = 3;
            let attempt = 0;
            
            while (attempt < maxAttempts) {
                // Get detailed description and check consistency
                const detailedScene = await writeDetailedSceneDescription(writtenScene);
                const previousDetailedScenes = await Promise.all(
                    previousScenes.items.map(prev => writeDetailedSceneDescription(prev))
                );
                const inconsistencies = await checkSceneConsistency(detailedScene, previousDetailedScenes);
                
                // If no inconsistencies found, return the scene
                if (!inconsistencies || inconsistencies.includes("No Continuity Errors Found")) {
                    return writtenScene;
                }
                    
                // Rewrite scene to fix inconsistencies
                console.log(`Attempt ${attempt + 1}: Rewriting scene to fix inconsistencies...`);
                writtenScene = await rewriteScene(writtenScene, sceneBeat, inconsistencies);
                
                // Verify the fixes and rewrite if needed
                const verificationResult = await verifySceneFixes(writtenScene, inconsistencies);
                if (verificationResult === "All issues resolved") {
                    return writtenScene;
                } else {
                    // Rewrite again with remaining issues
                    writtenScene = await rewriteScene(writtenScene, sceneBeat, verificationResult);
                }
                    
                attempt++;
                console.log(`Verification failed. Remaining issues: ${verificationResult}`);
            }
            
            console.log("Warning: Maximum rewrite attempts reached. Using best version.");
            return writtenScene;
            
        } catch (e) {
            console.log(`Error ${e}. Retrying...`);
            retries++;
        }
    }
    
    throw new Error("Failed to write scene after 5 attempts");
}

async function verifySceneFixes(rewrittenScene, originalIssues) {
    const prompt = `
    Verify if the rewritten scene has properly addressed all the previously identified issues.
    
    Original issues to fix:
    ${originalIssues}

    Rewritten scene:
    ${rewrittenScene}

    Check if each issue has been properly resolved. If any issues remain unresolved, list them specifically.
    Format remaining issues as a clear, numbered list that can be used for another rewrite.
    If all issues are resolved, respond only with: All issues resolved
    `;

    const response = await orClient.chat.completions.create({
        model: settings.OPENROUTER_MODEL_REASONING,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
    });

    const verificationResult = response.choices[0].message.content;
    console.log(`Verification result: ${verificationResult}`);
    return verificationResult;
}

async function storyIdeas() {
    // Get the story profile name from the settings
    const storyProfileName = settings.STORY_PROFILE;
    
    // Get the corresponding story profile from the MongoDB collection
    let storyProfile;
    try {
        const allStoryProfiles = await settings.loadStoryProfiles();
        storyProfile = allStoryProfiles[storyProfileName];
        
        if (!storyProfile) {
            console.log(`Error: Story profile '${storyProfileName}' not found in the video-types collection`);
            return null;
        }
    } catch (e) {
        console.log(`Error loading story profiles: ${e.toString()}`);
        return null;
    }

    if (settings.USE_REDDIT) {
        return findLongPost(storyProfile);
    } else if (settings.USE_FINE_TUNE) {
        const prompt = storyProfile.prompts[Math.floor(Math.random() * storyProfile.prompts.length)];
        console.log(`\n\n${prompt}\n\n`);
        
        const message = await oaiClient.chat.completions.create({
            model: storyProfile.model,
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
    } else {
        const prompt = storyProfile.prompts[Math.floor(Math.random() * storyProfile.prompts.length)];
        const message = await oaiClient.chat.completions.create({
            model: 'gpt-4o-2024-08-06',
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        return message.choices[0].message.content;
    }
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
                model: settings.OR_MODEL,
                max_tokens: 4000,
                temperature: 0.7,
                messages: [
                    {
                        role: "user", 
                        content: `## Instructions
                        
                        Using the given story outline, write short character descriptions for all the characters in the story in the following format:
                        <character name='(Character Name)' aliases='(Character Alias)'>(Character description)</character>

                        The character alias is what the other characters in the story will call that character in the story such as their first name.
                        For the Protagonist's alias you must create a name that other characters will call them in the story.
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

async function callTune4(scene) {
    // Split into paragraphs
    const paragraphs = scene.split('\n\n')
        .map(p => p.trim())
        .filter(p => p);
    
    // Group paragraphs based on if they contain quotes
    const groups = [];
    let currentGroup = [];
    let containsQuote = null;
    
    for (const p of paragraphs) {
        const currentContainsQuote = p.includes('"');
        
        // Start new group if quote status changes
        if (containsQuote !== null && currentContainsQuote !== containsQuote) {
            groups.push(currentGroup.join('\n\n'));
            currentGroup = [];
        }
        
        currentGroup.push(p);
        containsQuote = currentContainsQuote;
    }
    
    // Add final group
    if (currentGroup.length) {
        groups.push(currentGroup.join('\n\n'));
    }
    
    // Process each group with appropriate fine-tuning
    const processedGroups = [];
    for (const group of groups) {
        if (group.includes('"')) {
            processedGroups.push(group);
        } else {
            // Process narrative group 
            const maxRetries = 3;
            let retryCount = 0;
            
            while (retryCount < maxRetries) {
                try {
                    const completion = await oaiClient.chat.completions.create({
                        model: 'ft:gpt-4o-2024-08-06:personal:jgrupe-narration-ft:AQnm6wr1',
                        temperature: 0.7,
                        messages: [
                            {
                                role: "system", 
                                content: 'You are an expert copy editor tasked with re-writing the given text in Insomnia Stories unique voice and style.'
                            },
                            {
                                role: "user",
                                content: group
                            }
                        ]
                    });
                    const output = completion.choices[0].message.content;
                    
                    // Check if output is more than 1.5x the input length
                    if (output.length <= group.length * 1.5) {
                        processedGroups.push(replacePhrases(output));
                        break;
                    }
                    
                    retryCount++;
                    if (retryCount === maxRetries) {
                        processedGroups.push(replacePhrases(group));  // Use original if all retries fail
                    }
                    
                } catch (e) {
                    console.log(`Error processing narrative group: ${e}`);
                    retryCount++;
                    if (retryCount === maxRetries) {
                        processedGroups.push(replacePhrases(group));
                    }
                }
            }
        }
    }
    
    // Combine processed groups and apply word replacements
    const finalText = processedGroups.join('\n\n');
    return finalText.replace(/\*/g, '').replace(/_/g, '');
}

async function callTune5(scene) {
    // Split into paragraphs
    const paragraphs = scene.split('\n\n')
        .map(p => p.trim())
        .filter(p => p);
    
    // Group paragraphs based on if they start with quotes
    const groups = [];
    let currentGroup = [];
    let startsWithQuote = null;
    
    for (const p of paragraphs) {
        const currentStartsWithQuote = p.trimLeft().startsWith('"');
        
        // Start new group if quote status changes
        if (startsWithQuote !== null && currentStartsWithQuote !== startsWithQuote) {
            groups.push(currentGroup.join('\n\n'));
            currentGroup = [];
        }
        
        currentGroup.push(p);
        startsWithQuote = currentStartsWithQuote;
    }
    
    // Add final group
    if (currentGroup.length) {
        groups.push(currentGroup.join('\n\n'));
    }
    
    // Process each group with appropriate fine-tuning
    const processedGroups = [];
    for (const group of groups) {
        if (group.trimLeft().startsWith('"')) {
            // Keep dialogue as-is
            processedGroups.push(group);
        } else {
            // Process narrative group 
            const maxRetries = 3;
            let retryCount = 0;
            
            while (retryCount < maxRetries) {
                try {
                    const completion = await orClient.chat.completions.create({
                        model: settings.OR_MODEL,
                        messages: [
                            {
                                role: "user",
                                content: `Remove all appositive phrases relating to people or objects in the given text, except those that contain foreshadowing.
Remove all absolute phrases relating to people or objects in the given text, except those that provide sensory information or describe physical sensations.
Remove all metaphors in the given text.
Remove any sentences that add unnecessary detail or reflection without contributing new information to the scene.
Remove any phrases that mention the character's heart pounding or heart in their throat.

If a paragraph doesn't need to be changed then just leave it as is in the returned text.

Only respond with the modified text and nothing else.

## Text to edit:
${group}`
                            }
                        ]
                    });
                    const output = completion.choices[0].message.content;
                    
                    // Add success condition
                    if (output.length <= group.length * 2) {  // Similar to dialogue check
                        processedGroups.push(output);
                        break;
                    }
                    
                    retryCount++;
                    if (retryCount === maxRetries) {
                        processedGroups.push(group);  // Use original if all retries fail
                    }
                    
                } catch (e) {
                    console.log(`Error processing narrative group: ${e}`);
                    retryCount++;
                    if (retryCount === maxRetries) {
                        processedGroups.push(group);
                    }
                }
            }
        }
    }
    
    // Combine processed groups and apply word replacements
    const finalText = processedGroups.join('\n\n');
    return finalText.replace(/\*/g, '').replace(/_/g, '');
}

function replaceWords(text) {
    const wordBank = {
        'shifted': 'moved',
        'shift': 'change',
        'shifting': 'changing',
        'bravado': 'bravery',
        'loomed': 'appeared',
        'visage': 'face',
        'abyssal': 'deep',
        'amidst': 'surrounded by',
        'amiss': 'wrong',
        'ancient': 'old',
        'abruptly': 'suddenly',
        'awash': 'covered',
        'apprehension': 'dread',
        'beacon': 'signal',
        'beckoned': 'called',
        'bile': 'vomit',
        'bustling': 'busy',
        'bustled': 'hurried',
        'cacophony': 'noise',
        'ceaseless': 'endless',
        'clandestine': 'secret',
        'cloying': 'sickening',
        'croaked': 'yelled',
        'clang': 'noise',
        'comforting': 'soothing',
        'contorted': 'twisted',
        'determined': 'resolute',
        'disquiet': 'unease',
        'disarray': 'a mess',
        'dilapidated': 'falling apart',
        'ceased': 'stopped',
        'crescendo': '',
        'din': 'noise',
        'departed': 'left',
        'echoes': 'reverberations',
        'echoed': 'reverberated',
        'echoing': 'bouncing',
        'enigma': 'mystery',
        'ever-present': '',
        'facade': 'front',
        'footfall': 'step',
        'footfalls': 'Footsteps',
        'foreboding': 'dread',
        'falter': 'hesitate',
        'faltered': 'hesitated',
        'façade': 'front',
        'foliage': 'leaves',
        'form': 'body',
        'fled': 'ran',
        'flank': 'side',
        'jolted': 'jumped',
        'gloom': 'darkness',
        'gorge': 'throat',
        'grotesque': 'ugly',
        'grotesquely': '',
        'inexorably': 'relentlessly',
        'hulking': 'massive',
        'halt': 'stop',
        'halted': 'stopped',
        'incredulously': 'amazingly',
        'idyllic': 'beautiful',
        'labyrinthine': 'complex',
        'looming': 'impending',
        'looms': 'emerges',
        'loathsome': '',
        'macabre': 'grim',
        'maw': 'jaws',
        'monotonous': 'boring',
        'murmured': 'whispered',
        'manacles': 'handcuffs',
        'malevolent': 'evil',
        'midst': 'middle of',
        'normalcy': 'normality',
        'oppressive': '',
        'palpable': 'tangible',
        'pang': 'sense',
        'pallid': 'pale',
        'pumping': 'pulsating',
        'jostled': 'bumped',
        'resolve': 'determination',
        'resolved': 'determined',
        'rythmic': '',
        'remain': 'stay',
        'regaling': 'entertaining',
        'regaled': 'entertained',
        'raucous': 'loud',
        'sanctuary': 'refuge',
        'scanned': 'searched',
        'sentinel': 'guard',
        'sentinels': 'guards',
        'shrill': 'piercing',
        'sinewy': 'muscular',
        'sinister': 'menacing',
        'solitary': 'lonely',
        'solitude': 'loneliness',
        'slumber': 'sleep',
        'spectral': 'ghostly',
        'stark': 'harsh',
        'stifling': 'suffocating',
        'steeled': 'braced',
        'sturdy': 'strong',
        'scanned': 'searched',
        'symphony': 'harmony',
        'tangible': 'real',
        'tapestry': 'fabric',
        'testament': 'proof',
        'threadbare': 'worn',
        'thrummed': 'vibrated',
        'tendrils': 'tentacles',
        'tomes': 'books',
        'tinge': 'trace',
        'tinged': 'colored',
        'trepidation': 'fear',
        'throng': 'crowd',
        'twitched': 'shook',
        'unwavering': 'steady',
        'undulated': 'waved',
        'unflappable': 'calm',
        'uneasy': 'nervous',
        'undergrowth': 'shrubbery',
        'wavered': 'hesitated',
        'whirled': 'spun',
        'vigil': 'watch',
        'vast': 'large',
    };

    const phraseBank = {
        'I frowned. ': '',
        ', frowning': '',
        'I frowned and ': 'I',
        '\n---': '',
        '---\n': '',
        'a grotesque': 'an ugly',
        'long shadows': 'shadows',
        ' the midst of': '',
        ', and all-too-real': '',
        'an ancient-looking': 'an old',
        ', my heart pounding in my chest': '',
        ', my heart in my throat,': '',
    };

    // First replace phrases (do these first to avoid word replacements breaking phrases)
    for (const [old, new_] of Object.entries(phraseBank)) {
        const oldTrimmed = old.trim();
        if (text.includes(oldTrimmed)) {
            text = text.replaceAll(oldTrimmed, new_);
        }
    }

    // Then replace individual words
    const words = text.split(' ');
    for (const [old, new_] of Object.entries(wordBank)) {
        const oldTrimmed = old.trim();
        const count = words.filter(word => 
            word.replace(/[.,!?";:]/g, '').toLowerCase() === oldTrimmed.toLowerCase()
        ).length;
        
        if (count > 0) {
            const regex = new RegExp(`\\b${oldTrimmed}\\b`, 'gi');
            text = text.replace(regex, new_);
        }
    }

    return text;
}

function replacePhrases(text) {
    const phraseBank = {
        'I frowned. ': '',
        ', frowning': '',
        'I frowned and ': 'I',
        '\n---': '',
        '---\n': '',
        'a grotesque': 'an ugly',
        'long shadows': 'shadows',
        ' the midst of': '',
        ', and all-too-real': '',
        'an ancient-looking': 'an old',
        ', my heart pounding in my chest': '',
        ', my heart in my throat,': '',
        // Add other phrases here
    };

    // Replace phrases
    for (const [old, new_] of Object.entries(phraseBank)) {
        const oldTrimmed = old.trim();
        if (text.includes(oldTrimmed)) {
            const count = text.split(oldTrimmed).length - 1;
            if (count > 0) {
                text = text.replaceAll(oldTrimmed, new_);
            }
        }
    }

    return text;
}

async function writeStory(outline, characters, addTransitions = false) {
    console.log("Starting story writing process...");
    
    const scenes = [];
    const editedScenes = [];
    const originalScenes = [];

    const totalSteps = outline.length * 2;  // Writing and editing for each scene
    let progress = 0;
    
    const logProgress = (step) => {
        progress++;
        const percent = Math.round((progress / totalSteps) * 100);
        console.log(`Overall Progress: ${percent}% (${progress}/${totalSteps} steps)`);
    };

    // Initialize as null before the loop
    let nextScene = null;
    
    for (let num = 0; num < outline.length; num++) {
        const sceneBeat = outline[num];
        
        // If we already wrote this scene as nextScene, use it
        let scene;
        if (nextScene) {
            scene = nextScene;
        } else {
            // Write scene (only happens for first scene)
            console.log(`Writing Scene ${num + 1}`);
            scene = await writeScene(sceneBeat, characters, num, outline.length);
        }
            
        previousScenes.items.push(scene);
        originalScenes.push(scene);
        
        // Add transition if enabled and not the last scene
        if (addTransitions && num < outline.length - 1) {
            // Write the next scene (will be used in next iteration)
            nextScene = await writeScene(outline[num + 1], characters, num + 1, outline.length);
            const transition = await writeSceneTransition(scene, nextScene);
            console.log(`Transition: ${transition}`);
            scene = `${scene}\n\n${transition}`;
        } else {
            nextScene = null;
        }
        
        scenes.push(scene);
        logProgress('Writing');
    }

    // Second pass: Edit all scenes with transitions included
    for (let num = 0; num < scenes.length; num++) {
        console.log(`Editing Scene ${num + 1}`);
        const editedScene = await callTune4(scenes[num]);
        editedScenes.push(editedScene);
        logProgress('Editing');
    }

    const finalStory = editedScenes.join('\n\n');

    return [finalStory, editedScenes, originalScenes];
}

async function main(username, channelName) {
    try {
        // Initialize both general and channel-specific settings
        await settings.initializeSettings(username);
        await settings.initializeChannelSettings(username, channelName);
        
        // Initialize the clients with the loaded settings
        await initializeClients();
        
        // Generate story using channel-specific settings
        console.log("Generating story idea...");
        const storyIdea = await storyIdeas();
        console.log(storyIdea);
        if (!storyIdea) {
            throw new Error("Failed to generate story idea");
        }
        console.log("Story idea generated successfully");
        
        console.log("Creating outline...");
        const outline = await createOutline(storyIdea, settings.NUM_SCENES);
        if (!outline) {
            throw new Error("Failed to create outline");
        }
        console.log("Outline created successfully");
        
        console.log("Generating characters...");
        const char = await characters(outline);
        if (!char) {
            throw new Error("Failed to generate characters");
        }
        console.log("Characters generated successfully");
        
        console.log("Writing story...");
        const [story, editedScenes, originalScenes] = await writeStory(outline, char);
        if (!story || !editedScenes) {
            throw new Error("Failed to write story");
        }
        console.log("Story written successfully");

        // Save all versions of the story
        await fs.writeFile(
            `${channelName}_final_story.txt`, 
            editedScenes.join('\n\n\n\n'), 
            'utf-8'
        );
        
        if (Array.isArray(originalScenes)) {
            await fs.writeFile(
                `${channelName}_original_story.txt`, 
                originalScenes.join('\n\n\n\n'), 
                'utf-8'
            );
        }
        console.log("All story versions saved to files");

        return [story, editedScenes, storyIdea];
        
    } catch (e) {
        console.log(`Error in story_writer.main: ${e.toString()}`);
        console.log(`Error type: ${e.constructor.name}`);
        console.log(`Traceback: ${e.stack}`);
        return [null, null, null];
    }
}

async function main2(username, channelName) {
    // Initialize both general and channel-specific settings
    await settings.initializeSettings(username);
    await settings.initializeChannelSettings(username, channelName);
        
    // Initialize the clients with the loaded settings
    await initializeClients();

    // Read the story from file
    try {
        const story = await fs.readFile(`${channelName}_final_story.txt`, 'utf-8');
        
        // Split by 4 newlines to get scenes
        let editedScenes = story.split('\n\n\n\n');
        // edited_scenes = [callTune3(scene) for scene in edited_scenes]
        // Clean up any empty scenes
        editedScenes = editedScenes.filter(scene => scene.trim());
        
        // Join scenes with double newlines for final story
        const finalStory = editedScenes.join('\n\n');
        const storyIdea = finalStory;
        
        return [finalStory, editedScenes, storyIdea];
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Could not find ${channelName}_original_story.txt`);
        } else {
            console.log(`Error reading story file: ${error.message}`);
        }
        return [null, null, null];
    }
}

async function main3(username, channelName) {
    // Initialize both general and channel-specific settings
    await settings.initializeSettings(username);
    await settings.initializeChannelSettings(username, channelName);
        
    // Initialize the clients with the loaded settings
    await initializeClients();

    try {
        // Read the story from file
        const story = await fs.readFile(`${channelName}_rephrased_story.txt`, 'utf-8');
        
        // Split by 4 newlines to get scenes
        const editedScenes = story.split('\n\n\n\n');
        // Clean up any empty scenes before processing
        const scenesToProcess = editedScenes.filter(scene => scene.trim());
        
        // Process each scene with progress indicator
        console.log('\nProcessing scenes:');
        const processedScenes = [];
        for (let i = 0; i < scenesToProcess.length; i++) {
            const scene = scenesToProcess[i];
            process.stdout.write(`Processing scene ${i + 1}/${scenesToProcess.length}...\r`);
            const processedScene = await callTune4(scene);
            processedScenes.push(processedScene);
        }
        console.log('\nScene processing complete!');
        
        // Save the rewritten story
        await fs.writeFile(
            `${channelName}_rewritten_story.txt`, 
            processedScenes.join('\n\n\n\n'),
            'utf-8'
        );
        console.log(`Story saved to ${channelName}_rewritten_story.txt`);
                
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Could not find ${channelName}_rephrased_story.txt`);
            return [null, null, null];
        } else {
            console.log(`Error processing story: ${error.message}`);
            return [null, null, null];
        }
    }

    const finalStory = processedScenes.join('\n\n');
    const storyIdea = finalStory;
    return [finalStory, processedScenes, storyIdea];
}

// Export all functions
export {
    initializeClients,
    rewriteScene,
    writeScene,
    verifySceneFixes,
    storyIdeas,
    formatScenes,
    createOutline,
    characters,
    callTune5,
    writeStory,
    main,
    main2,
    main3
};

// Export main as default for backward compatibility
export default main;
