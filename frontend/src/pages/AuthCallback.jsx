import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';

const AuthCallback = () => {
    const navigate = useNavigate();

    const updateAllChannelStats = async (userId) => {
        try {
            console.log('\n=== Updating All Channel Stats ===');
            console.log('User ID:', userId);

            // Get all channels for the user
            const { data: channels, error: channelsError } = await supabase
                .from('youtube_accounts')
                .select('channel_id')
                .eq('user_id', userId);

            if (channelsError) throw channelsError;

            console.log('Found channels:', channels);

            // Update stats for each channel
            const updatePromises = channels.map(channel => 
                fetch(`${import.meta.env.VITE_API_URL}/youtube/channels/${channel.channel_id}/stats`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId })
                }).then(res => {
                    if (!res.ok) throw new Error(`Failed to update stats for channel ${channel.channel_id}`);
                    return res.json();
                })
            );

            const results = await Promise.all(updatePromises);
            console.log('All channel stats updated:', results);
            console.log('=== Channel Stats Update Complete ===\n');
        } catch (error) {
            console.error('\n=== Channel Stats Update Failed ===');
            console.error('Error updating channel statistics:', error);
        }
    };

    useEffect(() => {
        // Handle the OAuth callback
        const handleCallback = async () => {
            try {
                // Get the session - Supabase will automatically handle the OAuth response
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) throw error;

                if (session) {
                    // Successfully authenticated
                    console.log('Authentication successful');
                    
                    // Update channel statistics after successful login
                    await updateAllChannelStats(session.user.id);
                    
                    navigate('/dashboard');
                } else {
                    console.error('No session found');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error in auth callback:', error.message);
                navigate('/login');
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>Processing authentication...</p>
        </div>
    );
};

export default AuthCallback; 