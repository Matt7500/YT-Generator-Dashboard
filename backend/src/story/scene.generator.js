import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt } from './prompt.builder.js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generateScene(story, previousScenes = []) {
    try {
        // Build the context and prompt for the AI
        const prompt = buildPrompt(story, previousScenes);

        // Generate scene using Claude
        const response = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 4000,
            temperature: 0.7,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        return {
            content: response.content[0].text,
            metadata: {
                model: "claude-3-opus-20240229",
                prompt: prompt
            }
        };
    } catch (error) {
        console.error('Error generating scene:', error);
        throw error;
    }
}

export async function regenerateScene(story, sceneToRegenerate, previousScenes = [], feedback = null) {
    try {
        // Build prompt with feedback if provided
        const prompt = buildPrompt(story, previousScenes, {
            regenerating: true,
            currentScene: sceneToRegenerate,
            feedback: feedback
        });

        // Generate new version using Claude
        const response = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 4000,
            temperature: 0.7,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        return {
            content: response.content[0].text,
            metadata: {
                model: "claude-3-opus-20240229",
                prompt: prompt,
                previousVersion: sceneToRegenerate.content,
                feedback: feedback
            }
        };
    } catch (error) {
        console.error('Error regenerating scene:', error);
        throw error;
    }
} 