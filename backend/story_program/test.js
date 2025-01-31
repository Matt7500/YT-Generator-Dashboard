const { main: storyWriter, main2 } = require('./story_writer');
const { processLocal } = require('./local_operations');

// Add some visual separation before starting
console.log('\n'.repeat(2));
console.log('='.repeat(50));
console.log('Story Writer Test Program');
console.log('='.repeat(50));

async function runStoryProgram(username, channelName) {
    try {
        // Get story content from story_writer
        const [story, editedScenes, storyIdea] = await main2(username, channelName);
        
        if (!story) {
            throw new Error("Story writer failed to generate content");
        }

        // Process the story content using local_operations
        const {
            sceneImages,
            sceneAudioFiles,
            sceneDurations,
            finalAudioPath,
            thumbnailPath,
            title
        } = await processLocal(username, channelName, {
            storyText: story,
            scenes: editedScenes,
            storyIdea: storyIdea,
            useExistingAudio: false
        });

        console.log('\nProcessing completed successfully!');
        console.log('='.repeat(50));
        console.log('Generated Assets:');
        console.log(`Title: ${title}`);
        console.log(`Thumbnail: ${thumbnailPath}`);
        console.log(`Final Audio: ${finalAudioPath}`);
        console.log(`Number of Scenes: ${editedScenes.length}`);
        console.log('='.repeat(50));

        return {
            title,
            thumbnailPath,
            finalAudioPath,
            sceneImages,
            sceneAudioFiles,
            sceneDurations
        };

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