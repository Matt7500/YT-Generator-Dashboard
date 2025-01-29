import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userAuth } from '../contexts/AuthContext';
import { youtubeService } from '../services/youtubeService';
import '../css/YouTubeCallback.css';

const YouTubeCallback = () => {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { session } = userAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('\n=== Starting YouTube Callback Handler ===');
                console.log('Window info:', {
                    isPopup: !!window.opener,
                    origin: window.location.origin,
                    pathname: window.location.pathname,
                    search: window.location.search
                });

                // Get the authorization code from the URL
                const urlParams = new URLSearchParams(location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                
                console.log('URL parameters:', {
                    code: code ? code.substring(0, 10) + '...' : null,
                    state,
                    hasCode: !!code,
                    hasState: !!state
                });

                if (!code) {
                    throw new Error('No authorization code received');
                }

                if (!session?.user?.id) {
                    console.log('Session details:', {
                        exists: !!session,
                        hasUser: !!session?.user,
                        userId: session?.user?.id
                    });
                    throw new Error('User not authenticated');
                }

                // Handle the OAuth callback through our backend
                console.log('Sending request to backend with:', {
                    code: code.substring(0, 10) + '...',
                    userId: session.user.id
                });

                const response = await youtubeService.handleOAuthCallback(code, session.user.id);
                console.log('Backend response received:', response);

                // Send success message to parent window and close popup
                if (window.opener) {
                    console.log('Sending success message to parent window');
                    window.opener.postMessage({ 
                        type: 'YOUTUBE_OAUTH_SUCCESS',
                        message: 'YouTube channel connected successfully!'
                    }, window.location.origin);
                    window.close();
                } else {
                    console.log('No parent window found, redirecting in current window');
                    navigate('/settings', { 
                        state: { 
                            message: 'YouTube channel connected successfully!',
                            type: 'success'
                        }
                    });
                }

                console.log('=== YouTube Callback Handler Complete ===\n');
            } catch (error) {
                console.error('\n=== YouTube Callback Handler Failed ===');
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });

                const errorMessage = error.message || 'Failed to connect YouTube account. Please try again.';
                
                if (window.opener) {
                    console.log('Sending error message to parent window');
                    window.opener.postMessage({ 
                        type: 'YOUTUBE_OAUTH_ERROR',
                        message: errorMessage
                    }, window.location.origin);
                    window.close();
                } else {
                    console.log('No parent window found, showing error in current window');
                    setError(errorMessage);
                    setTimeout(() => {
                        navigate('/settings', {
                            state: {
                                message: errorMessage,
                                type: 'error'
                            }
                        });
                    }, 3000);
                }
            }
        };

        if (session) {
            handleCallback();
        } else {
            console.log('Waiting for session...');
        }
    }, [session, navigate, location]);

    if (error) {
        return (
            <div className="callback-container">
                <div className="callback-error">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="callback-container">
            <div className="callback-loading">
                Connecting your YouTube account...
            </div>
        </div>
    );
};

export default YouTubeCallback; 