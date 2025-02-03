import { main as storyWriter, main2 } from './autoStory.service.js';

// Add some visual separation before starting
console.log('\n'.repeat(2));
console.log('='.repeat(50));
console.log('Story Writer Test Program');
console.log('='.repeat(50));

async function runStoryProgram(username, channelName) {
    try {
        // Get story content from story_writer
        const [story, editedScenes, storyIdea] = await storyWriter(username, channelName);
        
        if (!story) {
            throw new Error("Story writer failed to generate content");
        }
        
    } catch (error) {
        console.error('Error in story program:', error);
        throw error;
    }
}

// Run the program with test username and channel
runStoryProgram("229202", "Insomnia Stories")
    .then(result => {
        console.log('Program completed successfully');
    })
    .catch(error => {
        console.error('Program failed:', error);
        process.exit(1);
    });