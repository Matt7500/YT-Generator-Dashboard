import { supabase } from '../config/supabase.js';
import { generateScene } from './scene.generator.js';
import { processUserFeedback } from './feedback.processor.js';

export async function createNewStory(userId, storyDetails) {
    try {
        const { data, error } = await supabase
            .from('stories')
            .insert([{
                user_id: userId,
                title: storyDetails.title,
                genre: storyDetails.genre,
                premise: storyDetails.premise,
                scenes: [],  // Initialize empty scenes array
                status: 'in_progress',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating story:', error);
        throw error;
    }
}

export async function generateNextScene(storyId) {
    try {
        // Get story with existing scenes
        const { data: story, error } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (error) throw error;

        // Generate new scene using AI
        const newScene = await generateScene(story, story.scenes || []);

        // Create new scene object
        const scene = {
            content: newScene.content,
            sequence: (story.scenes?.length || 0) + 1,
            status: 'draft'
        };

        // Return the new scene without saving it yet
        return {
            scene,
            metadata: newScene.metadata
        };
    } catch (error) {
        console.error('Error generating scene:', error);
        throw error;
    }
}

export async function updateScene(storyId, sceneIndex, updates, feedback = null) {
    try {
        // Get current story
        const { data: story, error: getError } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (getError) throw getError;

        // Process feedback if provided to improve the scene
        if (feedback) {
            await processUserFeedback({
                content: story.scenes[sceneIndex].content,
                feedback
            });
        }

        // Update the scene in the scenes array
        const updatedScenes = [...story.scenes];
        updatedScenes[sceneIndex] = {
            ...updatedScenes[sceneIndex],
            content: updates.content,
            status: updates.status
        };

        // Update the story with the modified scenes array
        const { data, error } = await supabase
            .from('stories')
            .update({
                scenes: updatedScenes,
                updated_at: new Date().toISOString()
            })
            .eq('id', storyId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating scene:', error);
        throw error;
    }
}

export async function finalizeScene(storyId, sceneIndex) {
    try {
        // Get current story
        const { data: story, error: getError } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (getError) throw getError;

        // Update the scene status to final
        const updatedScenes = [...story.scenes];
        updatedScenes[sceneIndex] = {
            content: updatedScenes[sceneIndex].content,
            sequence: updatedScenes[sceneIndex].sequence,
            status: 'final'
        };

        // Update the story
        const { data, error } = await supabase
            .from('stories')
            .update({
                scenes: updatedScenes,
                updated_at: new Date().toISOString()
            })
            .eq('id', storyId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error finalizing scene:', error);
        throw error;
    }
}

export async function getStory(storyId) {
    try {
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching story:', error);
        throw error;
    }
} 