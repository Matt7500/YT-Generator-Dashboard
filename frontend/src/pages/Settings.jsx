import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaYoutube, FaTiktok, FaTrash } from 'react-icons/fa';
import { userAuth } from '../contexts/AuthContext';
import supabase from '../clients/supabaseClient';
import '../css/Settings.css';
import { youtubeService } from '../services/youtubeService';

const Settings = () => {
    const [name, setName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordRequirements, setPasswordRequirements] = useState({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });
    const [youtubeAccounts, setYoutubeAccounts] = useState([]);
    const [tiktokAccounts, setTiktokAccounts] = useState([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
    const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
    const [message, setMessage] = useState(null);

    const { updatePassword } = userAuth();

    useEffect(() => {
        loadUserProfile();
        loadTwoFactorStatus();
        loadConnectedAccounts();
        const handleOAuthMessage = async (event) => {
            if (event.origin !== window.location.origin) return;

            // Close any existing OAuth popup windows
            const closeOAuthWindow = () => {
                const oauthPopup = window.localStorage.getItem('oauthPopup');
                if (oauthPopup) {
                    try {
                        const popup = JSON.parse(oauthPopup);
                        if (popup.name) {
                            window.opener?.close();
                        }
                    } catch (e) {
                        console.error('Error closing OAuth window:', e);
                    }
                    window.localStorage.removeItem('oauthPopup');
                }
            };

            if (event.data.type === 'YOUTUBE_OAUTH_SUCCESS') {
                closeOAuthWindow();
                if (event.data.error?.includes('duplicate key value')) {
                    setMessage({ 
                        text: 'This YouTube channel is already connected to your account.', 
                        type: 'error' 
                    });
                } else {
                    setMessage({ text: event.data.message, type: 'success' });
                    await loadConnectedAccounts();
                }
            } else if (event.data.type === 'YOUTUBE_OAUTH_ERROR') {
                closeOAuthWindow();
                const errorMessage = event.data.error?.includes('duplicate key value')
                    ? 'This YouTube channel is already connected to your account.'
                    : event.data.message || 'Failed to connect YouTube account';
                setMessage({ text: errorMessage, type: 'error' });
            } else if (event.data.type === 'TIKTOK_OAUTH_SUCCESS') {
                closeOAuthWindow();
                if (event.data.error?.includes('duplicate key value')) {
                    setMessage({ 
                        text: 'This TikTok account is already connected to your account.', 
                        type: 'error' 
                    });
                } else {
                    setMessage({ text: event.data.message, type: 'success' });
                    await loadConnectedAccounts();
                }
            } else if (event.data.type === 'TIKTOK_OAUTH_ERROR') {
                closeOAuthWindow();
                const errorMessage = event.data.error?.includes('duplicate key value')
                    ? 'This TikTok account is already connected to your account.'
                    : event.data.message || 'Failed to connect TikTok account';
                setMessage({ text: errorMessage, type: 'error' });
            }
        };

        window.addEventListener('message', handleOAuthMessage);
        return () => window.removeEventListener('message', handleOAuthMessage);
    }, []);

    const loadUserProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.name) {
                setName(user.user_metadata.name);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    };

    const loadTwoFactorStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('user_settings')
                .select('two_factor_enabled')
                .eq('user_id', user.id)
                .single();
            
            if (error) throw error;
            setTwoFactorEnabled(data?.two_factor_enabled || false);
        } catch (error) {
            console.error('Error loading 2FA status:', error);
        }
    };

    const loadConnectedAccounts = async () => {
        setIsLoadingAccounts(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Loading accounts for user:', user.id);
            
            // Load YouTube accounts
            const youtubeData = await youtubeService.getUserChannels(user.id);
            console.log('Loaded YouTube accounts:', youtubeData);
            setYoutubeAccounts(youtubeData || []);

            // Load TikTok accounts
            const { data: tiktokData, error: tiktokError } = await supabase
                .from('tiktok_accounts')
                .select('*')
                .eq('user_id', user.id);
            
            if (tiktokError) throw tiktokError;
            setTiktokAccounts(tiktokData || []);
        } catch (error) {
            console.error('Error loading connected accounts:', error);
            setError('Failed to load connected accounts');
        } finally {
            setIsLoadingAccounts(false);
        }
    };

    const validatePassword = (password) => {
        const requirements = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        setPasswordRequirements(requirements);
        return Object.values(requirements).every(Boolean);
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data: { user }, error } = await supabase.auth.updateUser({
                data: { name }
            });

            if (error) throw error;
            setSuccess('Name updated successfully');
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setIsLoading(false);
            return;
        }

        if (!validatePassword(newPassword)) {
            setError('New password does not meet requirements');
            setIsLoading(false);
            return;
        }

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: (await supabase.auth.getUser()).data.user?.email,
                password: currentPassword
            });

            if (signInError) throw new Error('Current password is incorrect');

            await updatePassword(newPassword);
            setSuccess('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle2FA = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!twoFactorEnabled) {
                // Enable 2FA
                const { data: { user } } = await supabase.auth.getUser();
                const { data, error } = await supabase.auth.mfa.enroll({
                    factorType: 'totp'
                });

                if (error) throw error;
                setQrCode(data.totp.qr_code);
            } else {
                // Disable 2FA
                const { error } = await supabase.auth.mfa.unenroll({
                    factorId: 'totp'
                });

                if (error) throw error;
                await supabase
                    .from('user_settings')
                    .update({ two_factor_enabled: false })
                    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

                setTwoFactorEnabled(false);
                setSuccess('Two-factor authentication disabled');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data, error } = await supabase.auth.mfa.challenge({
                factorId: 'totp',
                code: verificationCode
            });

            if (error) throw error;

            if (data.challenge) {
                await supabase
                    .from('user_settings')
                    .update({ two_factor_enabled: true })
                    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

                setTwoFactorEnabled(true);
                setQrCode('');
                setVerificationCode('');
                setSuccess('Two-factor authentication enabled');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectYouTube = async () => {
        setError('');
        setMessage(null);

        try {
            const authUrl = youtubeService.getAuthUrl();
            const channelId = new URL(authUrl).searchParams.get('state')?.split('_')[1];

            if (!channelId) {
                throw new Error('Could not get channel ID from auth URL');
            }

            const existingChannel = youtubeAccounts.find(account => account.channel_id === channelId);
            if (existingChannel) {
                setMessage({
                    text: `The channel "${existingChannel.channel_name}" is already connected to your account.`,
                    type: 'error'
                });
                return;
            }

            const popup = window.open(authUrl, 'YouTube OAuth', 'width=600,height=700');
            // Store popup reference
            window.localStorage.setItem('oauthPopup', JSON.stringify({ name: 'YouTube OAuth' }));

            // Check if popup was blocked
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                setError('Popup was blocked. Please allow popups for this site.');
                window.localStorage.removeItem('oauthPopup');
            }
        } catch (error) {
            console.error('Error in YouTube connection:', error);
            setError('Failed to initiate YouTube connection');
        }
    };

    const handleConnectTikTok = async () => {
        try {
            setError('');
            setMessage(null);

            const MAX_TIKTOK_ACCOUNTS = 5;
            if (tiktokAccounts.length >= MAX_TIKTOK_ACCOUNTS) {
                setMessage({
                    text: `You can only connect up to ${MAX_TIKTOK_ACCOUNTS} TikTok accounts.`,
                    type: 'error'
                });
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            const redirectUrl = `${window.location.origin}/auth/tiktok/callback`;
            
            const authUrl = `https://www.tiktok.com/auth/authorize?client_key=${process.env.VITE_TIKTOK_CLIENT_KEY}&redirect_uri=${redirectUrl}&response_type=code&scope=user.info.basic,video.list&state=${user.id}`;
            
            const popup = window.open(authUrl, 'TikTok OAuth', 'width=600,height=700');
            // Store popup reference
            window.localStorage.setItem('oauthPopup', JSON.stringify({ name: 'TikTok OAuth' }));

            // Check if popup was blocked
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                setError('Popup was blocked. Please allow popups for this site.');
                window.localStorage.removeItem('oauthPopup');
            }
        } catch (error) {
            console.error('TikTok connection error:', error);
            setError('Failed to connect TikTok account');
        }
    };

    const handleRemoveYouTubeAccount = async (channelId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await youtubeService.disconnectChannel(channelId, user.id);
            await loadConnectedAccounts(); // Refresh the list after removal
            setSuccess('YouTube account removed successfully');
        } catch (error) {
            setError('Failed to remove YouTube account');
            console.error('Error removing YouTube account:', error);
        }
    };

    const handleRemoveTikTokAccount = async (accountId) => {
        try {
            const { error } = await supabase
                .from('tiktok_accounts')
                .delete()
                .eq('id', accountId);

            if (error) throw error;
            await loadConnectedAccounts(); // Refresh the list after removal
            setSuccess('TikTok account removed successfully');
        } catch (error) {
            setError('Failed to remove TikTok account');
            console.error('Error removing TikTok account:', error);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-content">
                <h1 className="settings-title">Account Settings</h1>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                {message && (
                    <div className={`${message.type === 'error' ? 'error-message' : 'success-message'}`}>
                        {message.text}
                    </div>
                )}

                <div className="settings-section">
                    <div className="settings-card">
                        <h3>Profile Information</h3>
                        <form className="settings-form" onSubmit={handleUpdateName}>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Updating...' : 'Update Name'}
                            </button>
                        </form>
                    </div>

                    <div className="settings-card">
                        <h3>Change Password</h3>
                        <form className="settings-form" onSubmit={handleUpdatePassword}>
                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        tabIndex="-1"
                                    >
                                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group password-group">
                                <label htmlFor="newPassword">New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            validatePassword(e.target.value);
                                        }}
                                        onFocus={() => setIsNewPasswordFocused(true)}
                                        onBlur={() => setIsNewPasswordFocused(false)}
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        tabIndex="-1"
                                    >
                                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <div className={`password-requirements ${isNewPasswordFocused ? 'visible' : ''}`}>
                                    <h4>Password Requirements:</h4>
                                    <ul>
                                        <li className={passwordRequirements.minLength ? 'valid' : 'invalid'}>
                                            {passwordRequirements.minLength ? <FaCheck /> : <FaTimes />}
                                            At least 8 characters long
                                        </li>
                                        <li className={passwordRequirements.hasUpperCase ? 'valid' : 'invalid'}>
                                            {passwordRequirements.hasUpperCase ? <FaCheck /> : <FaTimes />}
                                            One uppercase letter
                                        </li>
                                        <li className={passwordRequirements.hasLowerCase ? 'valid' : 'invalid'}>
                                            {passwordRequirements.hasLowerCase ? <FaCheck /> : <FaTimes />}
                                            One lowercase letter
                                        </li>
                                        <li className={passwordRequirements.hasNumber ? 'valid' : 'invalid'}>
                                            {passwordRequirements.hasNumber ? <FaCheck /> : <FaTimes />}
                                            One number
                                        </li>
                                        <li className={passwordRequirements.hasSpecialChar ? 'valid' : 'invalid'}>
                                            {passwordRequirements.hasSpecialChar ? <FaCheck /> : <FaTimes />}
                                            One special character
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex="-1"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>

                    <div className="settings-card">
                        <h3>Two-Factor Authentication</h3>
                        <div className="tfa-container">
                            <div className="tfa-toggle">
                                <span>Enable Two-Factor Authentication</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={twoFactorEnabled}
                                        onChange={handleToggle2FA}
                                        disabled={isLoading}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            {qrCode && (
                                <div className="tfa-setup">
                                    <p>Scan this QR code with your authenticator app:</p>
                                    <img src={qrCode} alt="2FA QR Code" className="qr-code" />
                                    <form className="verification-form" onSubmit={handleVerify2FA}>
                                        <div className="form-group">
                                            <label htmlFor="verificationCode">Verification Code</label>
                                            <input
                                                type="text"
                                                id="verificationCode"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                                placeholder="Enter verification code"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="primary-button"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>Connections</h2>
                    
                    <div className="settings-card">
                        <h3>YouTube Accounts</h3>
                        <div className="youtube-accounts">
                            {isLoadingAccounts ? (
                                <p>Loading accounts...</p>
                            ) : youtubeAccounts.length > 0 ? (
                                <div className="channels-list">
                                    {youtubeAccounts.map(account => (
                                        <div key={account.id} className="channel-item">
                                            <div className="channel-thumbnail-container">
                                                <img
                                                    src={account.thumbnail_url || '/default-channel.png'}
                                                    alt={`${account.channel_name} thumbnail`}
                                                    className="channel-thumbnail"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        if (!e.target.retryAttempt) {
                                                            e.target.retryAttempt = true;
                                                            e.target.src = account.thumbnail_url;
                                                        } else {
                                                            e.target.src = '/default-channel.png';
                                                            e.target.onerror = null;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="channel-info">
                                                <h4>{account.channel_name}</h4>
                                                <div className="channel-stats">
                                                    <span>{new Intl.NumberFormat().format(account.subscriber_count)} subscribers</span>
                                                    <span>•</span>
                                                    <span>{new Intl.NumberFormat().format(account.video_count)} videos</span>
                                                </div>
                                            </div>
                                            <button
                                                className="remove-channel-btn"
                                                onClick={() => handleRemoveYouTubeAccount(account.channel_id)}
                                                aria-label={`Remove ${account.channel_name}`}
                                            >
                                                <FaTrash className="remove-icon" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No YouTube accounts connected</p>
                            )}
                            <button
                                className="youtube-connect-button"
                                onClick={handleConnectYouTube}
                                disabled={isLoading}
                            >
                                <FaYoutube className="youtube-icon" />
                                Connect YouTube Account
                            </button>
                        </div>
                    </div>

                    <div className="settings-card">
                        <h3>TikTok Accounts</h3>
                        <div className="tiktok-accounts">
                            {isLoadingAccounts ? (
                                <p>Loading accounts...</p>
                            ) : tiktokAccounts.length > 0 ? (
                                <div className="channels-list">
                                    {tiktokAccounts.map(account => (
                                        <div key={account.id} className="channel-item">
                                            <div className="channel-thumbnail-container">
                                                <img
                                                    src={account.avatar_url || '/default-tiktok.png'}
                                                    alt={account.username}
                                                    className="channel-thumbnail"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        if (!e.target.retryAttempt) {
                                                            e.target.retryAttempt = true;
                                                            e.target.src = account.avatar_url;
                                                        } else {
                                                            e.target.src = '/default-tiktok.png';
                                                            e.target.onerror = null;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="channel-info">
                                                <h4>{account.username}</h4>
                                                <div className="channel-stats">
                                                    <span>{account.follower_count} followers</span>
                                                    <span>•</span>
                                                    <span>{account.video_count} videos</span>
                                                </div>
                                            </div>
                                            <button
                                                className="remove-channel-btn"
                                                onClick={() => handleRemoveTikTokAccount(account.id)}
                                                aria-label="Remove account"
                                            >
                                                <FaTrash className="remove-icon" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No TikTok accounts connected</p>
                            )}
                            <button
                                className="tiktok-connect-button"
                                onClick={handleConnectTikTok}
                                disabled={isLoading}
                            >
                                <FaTiktok className="tiktok-icon" />
                                Connect TikTok Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings; 