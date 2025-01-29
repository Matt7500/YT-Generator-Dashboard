import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../css/Settings.css';

const Settings = () => {
    const { user, userProfile } = useAuth();
    const [displayName, setDisplayName] = useState(userProfile?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [connectedChannels, setConnectedChannels] = useState([
        {
            id: 'UC7_YxT-KID8kRbqZo7MyscQ',
            name: 'Markiplier',
            thumbnail: 'https://yt3.googleusercontent.com/ytc/AIf8zZTHUhGZ9-dpzql2Yx_oXHrQdSYuwO3wEBNRnAki=s176-c-k-c0x00ffffff-no-rj',
            subscriberCount: '35.2M',
            videoCount: '5,482'
        },
        {
            id: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
            name: 'MrBeast',
            thumbnail: 'https://yt3.googleusercontent.com/ytc/AIf8zZQqwA_vNmJBpV7BqaQGPQYT7Zq0-e8RYqyBmgPE=s176-c-k-c0x00ffffff-no-rj',
            subscriberCount: '233M',
            videoCount: '742'
        },
        {
            id: 'UCsBjURrPoezykLs9EqgamOA',
            name: 'Fireship',
            thumbnail: 'https://yt3.googleusercontent.com/ytc/AIf8zZR7WJUt5BKN3vJWqbhxqk5zpu9kBPaXBGUGy1QkFg=s176-c-k-c0x00ffffff-no-rj',
            subscriberCount: '2.51M',
            videoCount: '893'
        }
    ]);

    // Account Settings Handlers
    const handleUpdateName = async (e) => {
        e.preventDefault();
        // TODO: Implement name update logic
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        // TODO: Implement password update logic
    };

    const handleToggle2FA = async () => {
        if (!is2FAEnabled) {
            // TODO: Generate QR code and secret from Supabase
            // setQrCode(response.data.qr_code);
        } else {
            // TODO: Disable 2FA
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        // TODO: Verify 2FA setup
    };

    // Subscription Management Handlers
    const handleManageSubscription = () => {
        // TODO: Implement subscription management logic
    };

    // YouTube Account Management Handlers
    const handleConnectYouTube = () => {
        // TODO: Implement YouTube OAuth connection
        // After successful connection, add the channel to connectedChannels
    };

    const handleRemoveChannel = (channelId) => {
        // TODO: Implement channel removal logic
        setConnectedChannels(channels => 
            channels.filter(channel => channel.id !== channelId)
        );
    };

    return (
        <div className="settings-container">
            <div className="settings-content">

                {/* Account Settings Section */}
                <section className="settings-section">
                    <h2>Account Settings</h2>
                    
                    {/* Display Name Form */}
                    <div className="settings-card">
                        <h3>Display Name</h3>
                        <form onSubmit={handleUpdateName} className="settings-form">
                            <div className="form-group">
                                <label htmlFor="displayName">Name</label>
                                <input
                                    type="text"
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <button type="submit" className="primary-button">
                                Update Name
                            </button>
                        </form>
                    </div>

                    {/* Password Update Form */}
                    <div className="settings-card">
                        <h3>Change Password</h3>
                        <form onSubmit={handleUpdatePassword} className="settings-form">
                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button type="submit" className="primary-button">
                                Update Password
                            </button>
                        </form>
                    </div>

                    {/* 2FA Settings */}
                    <div className="settings-card">
                        <h3>Two-Factor Authentication</h3>
                        <div className="tfa-container">
                            <div className="tfa-toggle">
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={is2FAEnabled}
                                        onChange={handleToggle2FA}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span>{is2FAEnabled ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            
                            {qrCode && !is2FAEnabled && (
                                <div className="tfa-setup">
                                    <img src={qrCode} alt="2FA QR Code" className="qr-code" />
                                    <form onSubmit={handleVerify2FA} className="verification-form">
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Enter verification code"
                                        />
                                        <button type="submit" className="primary-button">
                                            Verify and Enable
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Subscription Management Section */}
                <section className="settings-section">
                    <h2>Subscription Management</h2>
                    <div className="settings-card">
                        <div className="subscription-info">
                            <h3>Current Plan: {userProfile?.subscription_tier || 'Free'}</h3>
                            <p>Status: {userProfile?.subscription_status || 'Active'}</p>
                            {userProfile?.subscription_end && (
                                <p>Next billing date: {new Date(userProfile.subscription_end).toLocaleDateString()}</p>
                            )}
                        </div>
                        <button onClick={handleManageSubscription} className="primary-button">
                            Manage Subscription
                        </button>
                    </div>
                </section>

                {/* YouTube Account Management Section */}
                <section className="settings-section">
                    <h2>YouTube Accounts</h2>
                    <div className="settings-card">
                        <div className="youtube-accounts">
                            {connectedChannels.length > 0 ? (
                                <div className="channels-list">
                                    {connectedChannels.map(channel => (
                                        <div key={channel.id} className="channel-item">
                                            <img 
                                                src={channel.thumbnail} 
                                                alt={`${channel.name} thumbnail`}
                                                className="channel-thumbnail"
                                            />
                                            <div className="channel-info">
                                                <h4>{channel.name}</h4>
                                                <div className="channel-stats">
                                                    <span>{channel.subscriberCount} subscribers</span>
                                                    <span>•</span>
                                                    <span>{channel.videoCount} videos</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveChannel(channel.id)}
                                                className="remove-channel-btn"
                                                title="Remove channel"
                                            >
                                                <svg viewBox="0 0 24 24" className="remove-icon">
                                                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Connect your YouTube accounts to manage them through our platform.</p>
                            )}
                        </div>
                        <button onClick={handleConnectYouTube} className="youtube-connect-button">
                            <svg className="youtube-icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/>
                            </svg>
                            Connect YouTube Account
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings; 