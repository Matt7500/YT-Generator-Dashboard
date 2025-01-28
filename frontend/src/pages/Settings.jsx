import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../utils/api';
import '../css/Settings.css';

const Settings = ({ isAuthenticated }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [platformConnections, setPlatformConnections] = useState([]);
    const [youtubeConnection, setYoutubeConnection] = useState(null);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailChangePassword, setEmailChangePassword] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching settings...');
                const response = await api.get('/settings');
                console.log('Settings response:', response.data);
                setSettings(response.data);
                
                console.log('Fetching platform connections...');
                const platformsResponse = await api.get('/settings/platforms');
                console.log('Platforms response:', platformsResponse.data);
                setPlatformConnections(platformsResponse.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching settings:', err);
                setError(err.response?.data?.message || 'Error fetching settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [isAuthenticated]);

    // A helper to log new platform states for debugging
    const setPlatformConnectionsWithLog = (newConnections) => {
        console.log('Setting platform connections:', {
            current: platformConnections,
            new: newConnections
        });
        setPlatformConnections(newConnections);
    };

    useEffect(() => {
        const youtube = platformConnections.find(p => p.platform === 'youtube');
        console.log('Detecting changes to platformConnections, found youtube:', youtube);
        setYoutubeConnection(youtube);
    }, [platformConnections]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            setSuccessMessage('Password updated successfully');
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error updating password');
        }
    };

    const handleSettingChange = async (field, value) => {
        try {
            const response = await api.patch('/settings', { [field]: value });
            setSettings(response.data);
            setSuccessMessage('Settings updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error updating settings:', err);
            setError(err.response?.data?.message || 'Error updating settings');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();
        try {
            await api.patch('/settings', { email: newEmail });
            setSettings(response => ({ ...response, email: newEmail }));
            setSuccessMessage('Email updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error updating email:', err);
            setError(err.response?.data?.message || 'Error updating email');
            setTimeout(() => setError(null), 3000);
        }
    };

    // Connect YouTube
    const handleConnectYouTube = async () => {
        try {
            const response = await api.get('/auth/youtube/connect');
            
            // Position the popup roughly center screen
            const width = 600;
            const height = 600;
            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;

            // Open the OAuth window
            const authWindow = window.open(
                response.data.authUrl,
                'YouTube Authorization',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Refresh YouTube data after successful connection
            const refreshYouTubeSection = async () => {
                try {
                    console.log('Refreshing YouTube section...');
                    // Add a small delay to let the server store any new channels
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const resPlatforms = await api.get('/settings/platforms');
                    console.log('Updated platform connections response:', resPlatforms.data);
                    
                    const newYoutubeConn = resPlatforms.data.find(p => p.platform === 'youtube');
                    const oldYoutubeConn = platformConnections.find(p => p.platform === 'youtube');

                    console.log('Comparing old/new YouTube connections:', {
                        old: oldYoutubeConn,
                        new: newYoutubeConn
                    });

                    if (newYoutubeConn) {
                        setPlatformConnectionsWithLog(resPlatforms.data);
                        setSuccessMessage('Channel connected successfully');
                        setTimeout(() => setSuccessMessage(''), 5000);
                    } else {
                        console.log('No YouTube connection found after refresh');
                    }
                } catch (err) {
                    console.error('Error refreshing YouTube section:', err);
                    setError('Failed to refresh YouTube channels');
                    setTimeout(() => setError(null), 5000);
                }
            };

            // Handler for receiving messages from the popup
            const handleCallback = async (event) => {
                console.log('handleCallback triggered, event:', {
                    data: event.data,
                    origin: event.origin,
                    locationOrigin: window.location.origin
                });

                try {
                    // Check for an object message
                    if (typeof event.data === 'object') {
                        if (event.data.type === 'youtube_success') {
                            console.log('Got youtube_success message:', event.data);
                            // Close the popup
                            if (authWindow && !authWindow.closed) {
                                authWindow.close();
                            }
                            // Refresh channels
                            await refreshYouTubeSection();
                            return;
                        }
                    }

                    // Check for a legacy "success" string
                    if (event.data === 'success') {
                        console.log('Received legacy success message');
                        if (authWindow && !authWindow.closed) {
                            authWindow.close();
                        }
                        await refreshYouTubeSection();
                    } else if (event.data === 'error') {
                        console.error('Received error message from OAuth flow');
                        setError('Failed to connect YouTube account');
                    } else {
                        console.log('Received unknown message:', event.data);
                    }
                } catch (err) {
                    console.error('YouTube callback error:', err);
                    setError('Failed to connect YouTube account');
                }
            };

            // Add message listener
            window.addEventListener('message', handleCallback);

            // Poll if the user closes the popup manually
            const checkInterval = setInterval(async () => {
                try {
                    if (!authWindow || authWindow.closed) {
                        console.log('Auth window closed, checking for updates...');
                        clearInterval(checkInterval);
                        await refreshYouTubeSection();
                    }
                } catch (err) {
                    console.log('Error checking window status, clearing interval:', err);
                    clearInterval(checkInterval);
                    await refreshYouTubeSection();
                }
            }, 500);

            // Cleanup removes the message listener if user leaves the page
            return () => {
                window.removeEventListener('message', handleCallback);
                clearInterval(checkInterval);
            };
        } catch (err) {
            console.error('YouTube connection error:', err);
            setError('Failed to initiate YouTube connection');
        }
    };

    // Remove a single YouTube channel
    const handleRemoveChannel = async (channelId) => {
        try {
            await api.delete(`/settings/youtube/channels/${channelId}`);
            const refreshResponse = await api.get('/settings/platforms');
            setPlatformConnections(refreshResponse.data);
            setSuccessMessage('Channel removed successfully');
        } catch (err) {
            console.error('Failed to remove channel:', err);
            setError('Failed to remove channel');
        }
    };

    // Disconnect all YouTube channels
    const handleDisconnectYouTube = async () => {
        try {
            await api.delete('/settings/platforms/youtube');
            const refreshResponse = await api.get('/settings/platforms');
            setPlatformConnections(refreshResponse.data);
            setSuccessMessage('YouTube account disconnected successfully');
        } catch (err) {
            console.error('Failed to disconnect YouTube:', err);
            setError('Failed to disconnect YouTube account');
        }
    };

    const refreshPlatformConnections = async () => {
        try {
            const response = await api.get('/settings/platforms');
            setPlatformConnectionsWithLog(response.data);
            const newYoutubeConnection = response.data.find(p => p.platform === 'youtube');
            setYoutubeConnection(newYoutubeConnection);
        } catch (err) {
            console.error('Error refreshing platform connections:', err);
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <div className="settings-page loading"></div>;
    }

    return (
        <div className="settings-page">
            <div className="settings-container">
                <h1>Account Settings</h1>
                
                {successMessage && (
                    <div className="success-message">{successMessage}</div>
                )}
                
                {error && (
                    <div className="error-message">{error}</div>
                )}

                <div className="settings-section">
                    <h2>Profile Settings</h2>
                    <div className="settings-grid">
                        <div className="setting-item">
                            <label>Email</label>
                            <div className="setting-value-container">
                                <div className="setting-value">{settings.email}</div>
                                <button 
                                    className="edit-btn"
                                    onClick={() => setShowEmailForm(!showEmailForm)}
                                >
                                    Edit
                                </button>
                            </div>
                            
                            {showEmailForm && (
                                <form onSubmit={handleEmailChange} className="settings-form">
                                    <div className="form-group">
                                        <label>New Email</label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password (to confirm)</label>
                                        <input
                                            type="password"
                                            value={emailChangePassword}
                                            onChange={(e) => setEmailChangePassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-buttons">
                                        <button type="submit" className="save-btn">
                                            Update Email
                                        </button>
                                        <button 
                                            type="button" 
                                            className="cancel-btn"
                                            onClick={() => {
                                                setShowEmailForm(false);
                                                setNewEmail('');
                                                setEmailChangePassword('');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="setting-item">
                            <label>Two-Factor Authentication</label>
                            <div className="setting-value-container">
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.two_factor_enabled}
                                        onChange={(e) => handleSettingChange('two_factor_enabled', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </div>
                                <p className="setting-description">
                                    {settings.two_factor_enabled 
                                        ? 'Two-factor authentication is enabled' 
                                        : 'Enable two-factor authentication for additional security'}
                                </p>
                            </div>
                        </div>

                        <div className="setting-item">
                            <label>Password</label>
                            <div className="setting-value-container">
                                <div className="setting-value">••••••••</div>
                                <button 
                                    className="edit-btn"
                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                >
                                    Change Password
                                </button>
                            </div>
                            
                            {showPasswordForm && (
                                <form onSubmit={handlePasswordChange} className="settings-form">
                                    <div className="form-group">
                                        <label>Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-buttons">
                                        <button type="submit" className="save-btn">
                                            Update Password
                                        </button>
                                        <button 
                                            type="button" 
                                            className="cancel-btn"
                                            onClick={() => {
                                                setShowPasswordForm(false);
                                                setCurrentPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>Connected Channels</h2>
                    <div className="platform-connections">
                        <div className="platform-card">
                            <div className="platform-info">
                                {youtubeConnection && youtubeConnection.channels.length > 0 ? (
                                    <div className="connection-status connected">
                                        <div className="channels-list">
                                            {youtubeConnection.channels.map(channel => (
                                                <div key={channel.id} className="channel-item">
                                                    <img 
                                                        src={channel.thumbnailUrl} 
                                                        alt={channel.title} 
                                                        className="channel-thumbnail"
                                                    />
                                                    <div className="channel-info">
                                                        <h4>{channel.title}</h4>
                                                        <p>{Number(channel.statistics.subscriberCount).toLocaleString()} subscribers</p>
                                                    </div>
                                                    <button
                                                        className="remove-channel-btn"
                                                        onClick={() => handleRemoveChannel(channel.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="connection-actions">
                                            <button 
                                                className="connect-btn"
                                                onClick={handleConnectYouTube}
                                            >
                                                Connect Another Account
                                            </button>
                                            <button 
                                                className="disconnect-btn"
                                                onClick={handleDisconnectYouTube}
                                            >
                                                Disconnect All
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="connection-status">
                                        <p className="connection-description">
                                            Connect your YouTube accounts to manage your channels and generate content.
                                        </p>
                                        <button 
                                            className="connect-btn"
                                            onClick={handleConnectYouTube}
                                        >
                                            Connect Account
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings; 