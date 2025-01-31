import Anthropic from '@anthropic-ai/sdk';
import { buildFeedbackPrompt } from './prompt.builder.js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export async function processUserFeedback(scene) {
    try {
        // Analyze feedback using AI to get suggestions for improvement
        const prompt = buildFeedbackPrompt(scene.content, scene.feedback);
        const analysis = await analyzeFeedback(prompt);
        return analysis;
    } catch (error) {
        console.error('Error processing feedback:', error);
        throw error;
    }
}

async function analyzeFeedback(prompt) {
    try {
        const response = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 2000,
            temperature: 0.3,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        return response.content[0].text;
    } catch (error) {
        console.error('Error analyzing feedback:', error);
        throw error;
    }
}

export async function getFeedbackHistory(sceneId) {
    try {
        const { data, error } = await supabase
            .from('scene_feedback')
            .select('*')
            .eq('scene_id', sceneId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching feedback history:', error);
        throw error;
    }
} 