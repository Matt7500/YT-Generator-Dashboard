import { useState, useEffect } from 'react';
import { userAuth } from '../contexts/AuthContext';
import supabase from '../clients/supabaseClient';
import { FaCog, FaVideo, FaYoutube, FaTiktok, FaPlus, FaTimes, FaSync } from 'react-icons/fa';
import '../css/Dashboard.css';
import NewStoryModal from '../components/NewStoryModal';
import { useLayout } from '../contexts/LayoutContext';
import { toast } from 'react-hot-toast';

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
    const { PageWrapper } = useLayout();

    useEffect(() => {
        if (session?.user?.id) {
            console.log('Session details:', {
                userId: session.user.id,
                email: session.user.email,
                role: session.user.role
            });
            loadChannels();
        }
    }, [session?.user?.id]);

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

            console.log('Loading channels for user:', {
                userId: session?.user?.id,
                sessionStatus: session?.user ? 'active' : 'inactive'
            });

            // Get channels from database
            const { data: channels, error } = await supabase
                .from('youtube_accounts')
                .select('*')
                .eq('user_id', session?.user?.id);

            if (error) {
                console.error('Supabase query error:', {
                    error: error.message,
                    code: error.code,
                    details: error.details
                });
                throw error;
            }

            console.log('Channels loaded:', {
                count: channels?.length || 0,
                channels: channels?.map(ch => ({
                    id: ch.channel_id,
                    name: ch.channel_name,
                    stats: {
                        subscribers: ch.subscriber_count,
                        views: ch.view_count,
                        videos: ch.video_count
                    },
                    lastUpdated: ch.updated_at
                }))
            });

            setChannels(channels || []);
        } catch (error) {
            console.error('Error loading channels:', error);
            setError('Failed to load channels');
            toast.error('Failed to load channels');
        } finally {
            setIsLoading(false);
        }
    };

    // Add a function to check if stats need updating
    const needsStatsUpdate = (lastUpdated) => {
        if (!lastUpdated) return true;
        const updateInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const lastUpdateTime = new Date(lastUpdated).getTime();
        return Date.now() - lastUpdateTime > updateInterval;
    };

    // Modify the refresh stats handler to include cooldown check
    const handleRefreshStats = async (channelId) => {
        try {
            const channel = channels.find(ch => ch.channel_id === channelId);
            
            if (!needsStatsUpdate(channel?.updated_at)) {
                toast.info('Statistics were updated recently. Please try again later.');
                return;
            }

            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(
                `${apiUrl}/youtube/channels/${channelId}/statistics?userId=${session?.user?.id}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to refresh statistics');
            }

            await loadChannels(); // Reload all channels to get updated data
            toast.success('Statistics updated successfully');
        } catch (error) {
            console.error('Error refreshing statistics:', error);
            toast.error('Failed to refresh statistics');
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
                <div className="channel-header-actions">
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
        <PageWrapper>

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
            {showModal && renderPlatformModal()}

            <NewStoryModal
                isOpen={isModalOpen}
                onClose={handleCloseStoryModal}
                channelId={selectedChannelId}
            />
        </PageWrapper>
    );
};

export default Dashboard;
