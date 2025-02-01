import supabase from '../clients/supabaseClient';

export async function createStory(storyData, channelId) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const { data, error } = await supabase
            .from('stories')
            .insert([{
                user_id: user.id,
                channel_id: channelId,
                title: storyData.title,
                genre: storyData.genre,
                premise: storyData.premise,
                scenes: [],
                status: 'draft'
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

export async function getUserStories(channelId = null) {
    try {
        let query = supabase
            .from('stories')
            .select('*, youtube_accounts!inner(*)')
            .order('created_at', { ascending: false });

        if (channelId) {
            query = query.eq('channel_id', channelId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching stories:', error);
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

export async function updateStory(storyId, updates) {
    try {
        const { data, error } = await supabase
            .from('stories')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', storyId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating story:', error);
        throw error;
    }
}

export async function deleteStory(storyId) {
    try {
        const { error } = await supabase
            .from('stories')
            .delete()
            .eq('id', storyId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting story:', error);
        throw error;
    }
}

export async function addScene(storyId, sceneContent) {
    try {
        const { data: story, error: fetchError } = await supabase
            .from('stories')
            .select('scenes')
            .eq('id', storyId)
            .single();

        if (fetchError) throw fetchError;

        const updatedScenes = [...(story.scenes || []), {
            content: sceneContent,
            created_at: new Date().toISOString(),
            status: 'draft'
        }];

        const { data, error: updateError } = await supabase
            .from('stories')
            .update({
                scenes: updatedScenes,
                updated_at: new Date().toISOString()
            })
            .eq('id', storyId)
            .select()
            .single();

        if (updateError) throw updateError;
        return data;
    } catch (error) {
        console.error('Error adding scene:', error);
        throw error;
    }
}

export async function updateScene(storyId, sceneIndex, updates) {
    try {
        const { data: story, error: fetchError } = await supabase
            .from('stories')
            .select('scenes')
            .eq('id', storyId)
            .single();

        if (fetchError) throw fetchError;

        const updatedScenes = [...story.scenes];
        updatedScenes[sceneIndex] = {
            ...updatedScenes[sceneIndex],
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error: updateError } = await supabase
            .from('stories')
            .update({
                scenes: updatedScenes,
                updated_at: new Date().toISOString()
            })
            .eq('id', storyId)
            .select()
            .single();

        if (updateError) throw updateError;
        return data;
    } catch (error) {
        console.error('Error updating scene:', error);
        throw error;
    }
} 