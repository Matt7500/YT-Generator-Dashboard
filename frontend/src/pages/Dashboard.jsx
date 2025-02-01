import { useState, useEffect } from 'react';
import { userAuth } from '../contexts/AuthContext';
import supabase from '../clients/supabaseClient';
import { FaCog, FaVideo, FaYoutube, FaTiktok, FaPlus, FaTimes } from 'react-icons/fa';
import '../css/Dashboard.css';
import NewStoryModal from '../components/NewStoryModal';

const Dashboard = () => {
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [loadedImages, setLoadedImages] = useState({});
    const { session } = userAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChannelId, setSelectedChannelId] = useState(null);

    useEffect(() => {
        loadChannels();
    }, []);

    // Preload images when channels are loaded
    useEffect(() => {
        channels.forEach(channel => {
            if (channel.thumbnail_url) {
                // Initialize loading state to false for this channel
                setLoadedImages(prev => ({
                    ...prev,
                    [channel.channel_id]: false
                }));

                const img = new Image();
                img.src = channel.thumbnail_url;
                img.onload = () => {
                    setLoadedImages(prev => ({
                        ...prev,
                        [channel.channel_id]: true
                    }));
                };
                img.onerror = () => {
                    // Try different image sizes and formats on error
                    if (img.src.includes('=s240-c-k-c0x00ffffff-no-rj')) {
                        img.src = img.src.split('=')[0];
                    } else if (img.src.includes('yt3.ggpht.com') || img.src.includes('googleusercontent.com')) {
                        img.src = `${img.src.split('=')[0]}=s240-c-k-c0x00ffffff-no-rj`;
                    } else {
                        setLoadedImages(prev => ({
                            ...prev,
                            [channel.channel_id]: false
                        }));
                    }
                };
            }
        });
    }, [channels]);

    const loadChannels = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data: channels, error } = await supabase
                .from('youtube_accounts')
                .select('*')
                .eq('user_id', session?.user?.id);

            if (error) throw error;

            // Update stats for each channel
            const updatedChannels = await Promise.all(channels.map(async (channel) => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/youtube/channels/${channel.channel_id}/stats`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userId: session?.user?.id })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Failed to update stats for channel ${channel.channel_id}`);
                    }
                    
                    const updatedChannel = await response.json();
                    return updatedChannel;
                } catch (err) {
                    console.error('Error updating channel stats:', err);
                    return channel; // Return original channel data if update fails
                }
            }));

            setChannels(updatedChannels || []);
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
        setSelectedChannelId(channelId);
        setIsModalOpen(true);
    };

    const handleConnectChannel = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowModal(false);
            setIsClosing(false);
        }, 300); // Match this with the animation duration
    };

    const handlePlatformSelect = (platform) => {
        console.log(`Selected platform: ${platform}`);
        // TODO: Implement platform-specific connection flow
        handleCloseModal();
    };

    const handleCloseStoryModal = () => {
        setIsModalOpen(false);
        setSelectedChannelId(null);
    };

    const renderChannelCard = (channel) => (
        <div key={channel.channel_id} className="channel-card">
            <div className="channel-card-header">
                <div className="channel-info">
                    <div className="channel-thumbnail-wrapper">
                        {loadedImages[channel.channel_id] === false && (
                            <div className="thumbnail-placeholder pulse" />
                        )}
                        <img 
                            src={channel.thumbnail_url || '/default-channel.png'} 
                            alt={`${channel.channel_name} thumbnail`}
                            className={`channel-thumbnail ${loadedImages[channel.channel_id] ? 'loaded' : ''}`}
                            loading="lazy"
                            onError={(e) => {
                                const currentSrc = e.target.src;
                                
                                // Don't retry if we're already on the default image
                                if (currentSrc === '/default-channel.png') {
                                    setLoadedImages(prev => ({
                                        ...prev,
                                        [channel.channel_id]: false
                                    }));
                                    return;
                                }

                                // Try different image sizes and formats
                                if (currentSrc.includes('=s240-c-k-c0x00ffffff-no-rj')) {
                                    e.target.src = currentSrc.split('=')[0];
                                } else if (currentSrc.includes('yt3.ggpht.com') || currentSrc.includes('googleusercontent.com')) {
                                    e.target.src = `${currentSrc.split('=')[0]}=s240-c-k-c0x00ffffff-no-rj`;
                                } else {
                                    e.target.src = '/default-channel.png';
                                    setLoadedImages(prev => ({
                                        ...prev,
                                        [channel.channel_id]: false
                                    }));
                                }
                            }}
                            onLoad={(e) => {
                                if (e.target.src !== '/default-channel.png') {
                                    setLoadedImages(prev => ({
                                        ...prev,
                                        [channel.channel_id]: true
                                    }));
                                }
                            }}
                        />
                    </div>
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
    );

    const renderConnectCard = () => (
        <div className="channel-card connect-card" onClick={handleConnectChannel}>
            <div className="connect-card-content">
                <div className="connect-card-header">
                    <div className="connect-icon">
                        <FaPlus />
                    </div>
                    <h2>Connect Channel</h2>
                </div>
                <div className="connect-card-description">
                    <p>Add a new YouTube or TikTok channel</p>
                </div>
            </div>
        </div>
    );

    const renderPlatformModal = () => (
        <div className={`modal-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleCloseModal}>
            <div className={`modal ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={handleCloseModal}>
                    <FaTimes />
                </button>
                <div className="modal-header">
                    <h2>Connect a Channel</h2>
                    <p>Choose a platform to connect your channel</p>
                </div>
                <div className="platform-options">
                    <div 
                        className="platform-option youtube"
                        onClick={() => handlePlatformSelect('youtube')}
                    >
                        <div className="platform-icon">
                            <FaYoutube />
                        </div>
                        <h3>YouTube</h3>
                        <p>Connect your YouTube channel</p>
                    </div>
                    <div 
                        className="platform-option tiktok"
                        onClick={() => handlePlatformSelect('tiktok')}
                    >
                        <div className="platform-icon">
                            <FaTiktok />
                        </div>
                        <h3>TikTok</h3>
                        <p>Connect your TikTok account</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <div className="sidebar-spacer"></div>
            <div className="dashboard-content">
                <div className="dashboard-header">
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
                                <>
                                    {channels.map(renderChannelCard)}
                                    {channels.length < 6 && renderConnectCard()}
                                </>
                            ) : (
                                renderConnectCard()
                            )}
                        </div>
                    )}
                </div>
            </div>
            {showModal && renderPlatformModal()}

            <NewStoryModal
                isOpen={isModalOpen}
                onClose={handleCloseStoryModal}
                channelId={selectedChannelId}
            />
        </div>
    );
};

export default Dashboard;
