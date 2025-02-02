import { fileURLToPath } from 'url';
import {
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
} from './backend/story_program/story_writer.js';

// Test data
const testSceneBeat = "The protagonist enters a dimly lit room, finding mysterious symbols etched on the walls.";
const testCharacters = `<character name='John Smith' aliases='John'>A tall man with dark hair and piercing blue eyes.</character>
<character name='Sarah Jones' aliases='Sarah'>A woman in her thirties with red hair and a cautious demeanor.</character>`;
const testOutline = [
    "Scene 1: The protagonist discovers an old journal in their attic.",
    "Scene 2: Strange symbols begin appearing around their house.",
    "Scene 3: The protagonist meets a mysterious stranger who knows about the symbols."
];

// Test functions
async function testInitializeClients() {
    console.log("\nTesting initializeClients()...");
    try {
        await initializeClients();
        console.log("✓ initializeClients test passed");
    } catch (error) {
        console.error("✗ initializeClients test failed:", error);
    }
}

async function testRewriteScene() {
    console.log("\nTesting rewriteScene()...");
    const originalScene = "The protagonist walked into the room nervously.";
    const inconsistencies = "Character's emotion is not consistent with previous scenes.";
    try {
        const result = await rewriteScene(originalScene, testSceneBeat, inconsistencies);
        console.log("Result:", result);
        console.log("✓ rewriteScene test passed");
    } catch (error) {
        console.error("✗ rewriteScene test failed:", error);
    }
}

async function testWriteScene() {
    console.log("\nTesting writeScene()...");
    try {
        const result = await writeScene(testSceneBeat, testCharacters, 0, 3);
        console.log("Result:", result);
        console.log("✓ writeScene test passed");
    } catch (error) {
        console.error("✗ writeScene test failed:", error);
    }
}

async function testVerifySceneFixes() {
    console.log("\nTesting verifySceneFixes()...");
    const rewrittenScene = "The protagonist confidently entered the room, their previous fears forgotten.";
    const originalIssues = "Character's emotion is not consistent with previous scenes.";
    try {
        const result = await verifySceneFixes(rewrittenScene, originalIssues);
        console.log("Result:", result);
        console.log("✓ verifySceneFixes test passed");
    } catch (error) {
        console.error("✗ verifySceneFixes test failed:", error);
    }
}

async function testStoryIdeas() {
    console.log("\nTesting storyIdeas()...");
    try {
        const result = await storyIdeas();
        console.log("Result:", result);
        console.log("✓ storyIdeas test passed");
    } catch (error) {
        console.error("✗ storyIdeas test failed:", error);
    }
}

async function testFormatScenes() {
    console.log("\nTesting formatScenes()...");
    const testJson = `[
        {"scene_number": 1, "scene_beat": "Scene 1 description"},
        {"scene_number": 2, "scene_beat": "Scene 2 description"}
    ]`;
    try {
        const result = formatScenes(testJson);
        console.log("Result:", result);
        console.log("✓ formatScenes test passed");
    } catch (error) {
        console.error("✗ formatScenes test failed:", error);
    }
}

async function testCreateOutline() {
    console.log("\nTesting createOutline()...");
    const idea = "A story about a detective who discovers mysterious symbols appearing around their city.";
    try {
        const result = await createOutline(idea, 3);
        console.log("Result:", result);
        console.log("✓ createOutline test passed");
    } catch (error) {
        console.error("✗ createOutline test failed:", error);
    }
}

async function testCharacters() {
    console.log("\nTesting characters()...");
    try {
        const result = await characters(testOutline);
        console.log("Result:", result);
        console.log("✓ characters test passed");
    } catch (error) {
        console.error("✗ characters test failed:", error);
    }
}

async function testCallTune5() {
    console.log("\nTesting callTune5()...");
    const testScene = "The protagonist walked slowly through the dimly lit corridor, their heart pounding with each step. The ancient walls seemed to whisper secrets of the past.";
    try {
        const result = await callTune5(testScene);
        console.log("Result:", result);
        console.log("✓ callTune5 test passed");
    } catch (error) {
        console.error("✗ callTune5 test failed:", error);
    }
}

async function testWriteStory() {
    console.log("\nTesting writeStory()...");
    try {
        const [story, editedScenes, originalScenes] = await writeStory(testOutline, testCharacters);
        console.log("Story Result:", story ? "Story generated" : "No story");
        console.log("Edited Scenes:", editedScenes ? editedScenes.length : 0);
        console.log("Original Scenes:", originalScenes ? originalScenes.length : 0);
        console.log("✓ writeStory test passed");
    } catch (error) {
        console.error("✗ writeStory test failed:", error);
    }
}

async function testMain() {
    console.log("\nTesting main()...");
    try {
        const [story, editedScenes, storyIdea] = await main("testUser", "testChannel");
        console.log("Story Result:", story ? "Story generated" : "No story");
        console.log("Edited Scenes:", editedScenes ? editedScenes.length : 0);
        console.log("Story Idea:", storyIdea ? "Idea generated" : "No idea");
        console.log("✓ main test passed");
    } catch (error) {
        console.error("✗ main test failed:", error);
    }
}

async function testMain2() {
    console.log("\nTesting main2()...");
    try {
        const [story, editedScenes, storyIdea] = await main2("testUser", "testChannel");
        console.log("Story Result:", story ? "Story generated" : "No story");
        console.log("Edited Scenes:", editedScenes ? editedScenes.length : 0);
        console.log("Story Idea:", storyIdea ? "Idea generated" : "No idea");
        console.log("✓ main2 test passed");
    } catch (error) {
        console.error("✗ main2 test failed:", error);
    }
}

async function testMain3() {
    console.log("\nTesting main3()...");
    try {
        const [story, editedScenes, storyIdea] = await main3("testUser", "testChannel");
        console.log("Story Result:", story ? "Story generated" : "No story");
        console.log("Edited Scenes:", editedScenes ? editedScenes.length : 0);
        console.log("Story Idea:", storyIdea ? "Idea generated" : "No idea");
        console.log("✓ main3 test passed");
    } catch (error) {
        console.error("✗ main3 test failed:", error);
    }
}

// Function to run all tests
async function runAllTests() {
    console.log("Starting all tests...");
    
    await testInitializeClients();
    await testRewriteScene();
    await testWriteScene();
    await testVerifySceneFixes();
    await testStoryIdeas();
    await testFormatScenes();
    await testCreateOutline();
    await testCharacters();
    await testCallTune5();
    await testWriteStory();
    await testMain();
    await testMain2();
    await testMain3();
    
    console.log("\nAll tests completed!");
}

// Function to run a specific test
async function runSpecificTest(testName) {
    const tests = {
        initializeClients: testInitializeClients,
        rewriteScene: testRewriteScene,
        writeScene: testWriteScene,
        verifySceneFixes: testVerifySceneFixes,
        storyIdeas: testStoryIdeas,
        formatScenes: testFormatScenes,
        createOutline: testCreateOutline,
        characters: testCharacters,
        callTune5: testCallTune5,
        writeStory: testWriteStory,
        main: testMain,
        main2: testMain2,
        main3: testMain3
    };

    if (tests[testName]) {
        console.log(`Running test for ${testName}...`);
        await tests[testName]();
    } else {
        console.log(`Test "${testName}" not found. Available tests:`, Object.keys(tests));
    }
}

export {
    runAllTests,
    runSpecificTest
};

// Run all tests if this file is being run directly
if (import.meta.url === fileURLToPath(process.argv[1])) {
    runAllTests();
}