import express from 'express';
import { initializeClients, storyIdeas, createOutline, createTitle } from '../services/story/manualStory.service.js';

const router = express.Router();

router.get('/generate', (req, res) => {
    const { title, genre, premise } = req.query;

    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Helper function to send progress updates
    const sendProgress = (progress, step) => {
        res.write(`data: ${JSON.stringify({ progress, step })}\n\n`);
    };

    // Handle client disconnect
    req.on('close', () => {
        res.end();
    });

    // Start the story generation process
    (async () => {
        try {
            // Initialize clients
            sendProgress(10, 'Initializing AI clients...');
            await initializeClients();
            
            // Generate story ideas using the premise
            sendProgress(30, 'Generating story ideas...');
            const ideas = await storyIdeas(premise);
            if (!ideas) {
                throw new Error('Failed to generate story ideas');
            }

            // Create outline
            sendProgress(50, 'Creating story outline...');
            const outline = await createOutline(ideas);
            if (!outline) {
                throw new Error('Failed to create story outline');
            }

            // Generate title
            sendProgress(70, 'Generating title...');
            const generatedTitle = await createTitle(outline.join('\n'));
            if (!generatedTitle) {
                throw new Error('Failed to generate title');
            }

            // Send final data
            sendProgress(90, 'Finalizing...');
            res.write(`data: ${JSON.stringify({
                progress: 100,
                step: 'Complete!',
                data: {
                    ideas,
                    outline,
                    title: generatedTitle
                }
            })}\n\n`);
            
        } catch (error) {
            console.error('Error in story generation:', error);
            res.write(`data: ${JSON.stringify({
                error: error.message
            })}\n\n`);
        } finally {
            res.end();
        }
    })();
});

export default router; 