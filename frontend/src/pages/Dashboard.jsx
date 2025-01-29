import { useState, useEffect } from 'react';
import { userAuth } from '../contexts/AuthContext';
import supabase from '../clients/supabaseClient';
import { FaCog, FaVideo, FaYoutube, FaTiktok } from 'react-icons/fa';
import '../css/Dashboard.css';

const Dashboard = () => {
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { session } = userAuth();

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data: channels, error } = await supabase
                .from('youtube_accounts')
                .select('*')
                .eq('user_id', session?.user?.id);

            if (error) throw error;
            setChannels(channels);
        } catch (error) {
            console.error('Error loading channels:', error);
            setError('Failed to load channels');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingsClick = (channelId) => {
        // TODO: Implement settings navigation
        console.log('Settings clicked for channel:', channelId);
    };

    const handleCreateVideo = (channelId) => {
        // TODO: Implement create video navigation
        console.log('Create video clicked for channel:', channelId);
    };

    return (
        <div className="dashboard">
            <div className="sidebar-spacer"></div>
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Dashboard</h1>
                    <p className="subtitle">Manage your channels and content</p>
                </div>

                <div className="dashboard-cards">
                    {isLoading ? (
                        <div className="loading-state">Loading channels...</div>
                    ) : error ? (
                        <div className="error-state">{error}</div>
                    ) : (
                        <div className="channel-grid">
                            {channels.length > 0 ? (
                                channels.map((channel) => (
                                    <div key={channel.channel_id} className="channel-card">
                                        <div className="channel-card-header">
                                            <div className="channel-info">
                                                <img 
                                                    src={channel.thumbnail_url} 
                                                    alt={`${channel.channel_name} thumbnail`}
                                                    className="channel-thumbnail"
                                                />
                                                <div className="channel-name-wrapper">
                                                    <h2>{channel.channel_name}</h2>
                                                </div>
                                            </div>
                                            <div className={`platform-badge ${channel.platform || 'youtube'}`}>
                                                {channel.platform === 'tiktok' ? (
                                                    <>
                                                        <FaTiktok /> TikTok
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaYoutube /> YouTube
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="channel-stats">
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    {channel.platform === 'tiktok' ? 'Followers' : 'Subscribers'}
                                                </span>
                                                <span className="stat-value">
                                                    {new Intl.NumberFormat().format(channel.subscriber_count || channel.follower_count)}
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Total Views</span>
                                                <span className="stat-value">
                                                    {new Intl.NumberFormat().format(channel.view_count)}
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Videos</span>
                                                <span className="stat-value">
                                                    {new Intl.NumberFormat().format(channel.video_count)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="channel-actions">
                                            <button 
                                                className="action-button settings-button"
                                                onClick={() => handleSettingsClick(channel.channel_id)}
                                            >
                                                <FaCog /> Settings
                                            </button>
                                            <button 
                                                className="action-button create-video-button"
                                                onClick={() => handleCreateVideo(channel.channel_id)}
                                            >
                                                <FaVideo /> Create Video
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">No channels connected</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
