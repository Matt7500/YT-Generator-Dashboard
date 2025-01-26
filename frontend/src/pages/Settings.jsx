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

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                setSettings(response.data);
                
                // Fetch platform connections
                const platformsResponse = await api.get('/settings/platforms');
                setPlatformConnections(platformsResponse.data);
            } catch (err) {
                console.error('Error fetching settings:', err);
                setError(err.response?.data?.message || 'Error fetching settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

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

    // Will be implemented later with YouTube API
    const handleConnectYouTube = () => {
        // Placeholder for YouTube OAuth flow
        console.log('YouTube connection will be implemented later');
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return <div className="settings-page loading">Loading...</div>;
    }

    if (error) {
        return <div className="settings-page error">Error: {error}</div>;
    }

    return (
        <div className="settings-page">
            <h1>Account Settings</h1>
            
            {successMessage && (
                <div className="success-message">{successMessage}</div>
            )}
            
            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="settings-section">
                <h2>Account Security</h2>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Email</label>
                        <div className="setting-value">{settings.email}</div>
                    </div>

                    <div className="setting-item">
                        <label>Two-Factor Authentication</label>
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

                    <div className="setting-item full-width">
                        <button 
                            className="change-password-btn"
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                        >
                            Change Password
                        </button>
                        
                        {showPasswordForm && (
                            <form onSubmit={handlePasswordChange} className="password-form">
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
                <h2>Preferences</h2>
                <div className="settings-grid">
                    <div className="setting-item">
                        <label>Theme</label>
                        <select 
                            value={settings.theme} 
                            onChange={(e) => handleSettingChange('theme', e.target.value)}
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>

                    <div className="setting-item">
                        <label>Email Notifications</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.email_notifications}
                                onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h2>Connected Platforms</h2>
                <div className="platform-connections">
                    <div className="platform-card">
                        <img src="/youtube-icon.png" alt="YouTube" className="platform-icon" />
                        <div className="platform-info">
                            <h3>YouTube</h3>
                            {platformConnections.find(p => p.platform === 'youtube') ? (
                                <div className="connection-status connected">
                                    Connected
                                    <button className="disconnect-btn">Disconnect</button>
                                </div>
                            ) : (
                                <div className="connection-status">
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
    );
};

export default Settings; 