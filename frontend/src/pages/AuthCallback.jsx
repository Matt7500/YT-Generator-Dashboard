import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../utils/supabase';
import '../css/VerifyEmail.css';

const AuthCallback = () => {
    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleEmailVerification = async () => {
            try {
                // Log the full URL and location object for debugging
                console.log('Full URL:', window.location.href);
                console.log('Location object:', {
                    pathname: location.pathname,
                    search: location.search,
                    hash: location.hash
                });

                // Extract token from URL - checking both query params and hash
                const hashParams = new URLSearchParams(location.hash.replace(/^#+/, ''));
                const queryParams = new URLSearchParams(location.search);
                
                // Check for error parameters first
                const error = hashParams.get('error');
                const errorCode = hashParams.get('error_code');
                const errorDescription = hashParams.get('error_description');

                if (error) {
                    console.log('Error parameters found:', { error, errorCode, errorDescription });
                    throw new Error(errorDescription?.replace(/\+/g, ' ') || 'Verification failed');
                }
                
                // Try different possible parameter names
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');

                console.log('Extracted params:', { accessToken, type });

                if (!accessToken) {
                    // Check current session
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    console.log('Current session:', session);
                    
                    if (sessionError) {
                        console.error('Session error:', sessionError);
                        throw sessionError;
                    }

                    if (session) {
                        console.log('Already authenticated');
                        setVerificationStatus('success');
                        setTimeout(() => {
                            navigate('/login', {
                                replace: true,
                                state: { message: 'Email verified successfully! Please sign in.' }
                            });
                        }, 2000);
                        return;
                    }

                    throw new Error('No verification token found');
                }

                // Set up auth state change listener
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    console.log('Auth state change:', event, session);
                    
                    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                        try {
                            // Create or update user record
                            const { error: userError } = await supabase
                                .from('users')
                                .upsert({
                                    id: session.user.id,
                                    email: session.user.email,
                                    role: 'user',
                                    is_verified: true,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                }, {
                                    onConflict: 'id',
                                    ignoreDuplicates: false
                                });

                            if (userError) {
                                console.error('Error creating user record:', userError);
                                throw userError;
                            }

                            // Create default user settings
                            const { error: settingsError } = await supabase
                                .from('user_settings')
                                .upsert({
                                    user_id: session.user.id,
                                    theme: 'light',
                                    email_notifications: true,
                                    two_factor_enabled: false,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                }, {
                                    onConflict: 'user_id',
                                    ignoreDuplicates: false
                                });

                            if (settingsError) {
                                console.error('Error creating settings:', settingsError);
                                throw settingsError;
                            }

                            // Create audit log entry for verification
                            const { error: auditError } = await supabase
                                .from('audit_logs')
                                .insert({
                                    user_id: session.user.id,
                                    event_type: 'EMAIL_VERIFIED',
                                    details: {
                                        email: session.user.email,
                                        verification_time: new Date().toISOString()
                                    }
                                });

                            if (auditError) {
                                console.error('Error creating audit log:', auditError);
                                // Don't throw here as it's not critical
                            }

                            console.log('User record and settings created successfully');
                            setVerificationStatus('success');
                            
                            // Wait a moment before signing out and redirecting
                            setTimeout(async () => {
                                try {
                                    await supabase.auth.signOut();
                                    navigate('/login', {
                                        replace: true,
                                        state: { message: 'Email verified successfully! Please sign in.' }
                                    });
                                } catch (err) {
                                    console.error('Error during sign out:', err);
                                }
                            }, 2000);
                        } catch (err) {
                            console.error('Error during user setup:', err);
                            setVerificationStatus('error');
                            setError('Failed to create user record. Please contact support.');
                        }
                    }
                });

                // Set the session with the received tokens
                console.log('Setting session with access token...');
                const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (setSessionError) {
                    console.error('Session setting error:', setSessionError);
                    throw setSessionError;
                }

                // Immediately create user record after session is set
                if (sessionData?.session?.user) {
                    try {
                        const user = sessionData.session.user;
                        console.log('Creating user record for:', user.id);

                        // Create or update user record
                        const { error: userError } = await supabase
                            .from('users')
                            .upsert({
                                id: user.id,
                                email: user.email,
                                role: 'user',
                                is_verified: true,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            });

                        if (userError) {
                            console.error('Error creating user record:', userError);
                            throw userError;
                        }

                        // Create default user settings
                        const { error: settingsError } = await supabase
                            .from('user_settings')
                            .upsert({
                                user_id: user.id,
                                theme: 'light',
                                email_notifications: true,
                                two_factor_enabled: false,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            });

                        if (settingsError) {
                            console.error('Error creating settings:', settingsError);
                            throw settingsError;
                        }

                        // Create audit log entry for verification
                        const { error: auditError } = await supabase
                            .from('audit_logs')
                            .insert({
                                user_id: user.id,
                                event_type: 'EMAIL_VERIFIED',
                                details: {
                                    email: user.email,
                                    verification_time: new Date().toISOString()
                                }
                            });

                        if (auditError) {
                            console.error('Error creating audit log:', auditError);
                            // Don't throw here as it's not critical
                        }

                        console.log('User record and settings created successfully');
                        setVerificationStatus('success');

                        // Sign out and redirect after successful creation
                        setTimeout(async () => {
                            try {
                                await supabase.auth.signOut();
                                navigate('/login', {
                                    replace: true,
                                    state: { message: 'Email verified successfully! Please sign in.' }
                                });
                            } catch (err) {
                                console.error('Error during sign out:', err);
                            }
                        }, 2000);
                    } catch (err) {
                        console.error('Error during user setup:', err);
                        throw new Error('Failed to create user record: ' + err.message);
                    }
                }

                console.log('Email verification successful');

                // Clean up subscription on unmount
                return () => {
                    subscription.unsubscribe();
                };

            } catch (err) {
                console.error('Verification error:', err);
                setVerificationStatus('error');
                setError(err.message === 'Email link is invalid or has expired' 
                    ? 'Your verification link has expired. Please request a new one.'
                    : err.message || 'Error verifying email');
            }
        };

        handleEmailVerification();
    }, [navigate, location]);

    const renderContent = () => {
        switch (verificationStatus) {
            case 'verifying':
                return (
                    <div className="verification-status">
                        <div className="loading-spinner"></div>
                        <p>Verifying your email address...</p>
                    </div>
                );
            
            case 'success':
                return (
                    <div className="verification-status success">
                        <div className="success-icon">✓</div>
                        <h2>Email Verified!</h2>
                        <p>Your email has been successfully verified.</p>
                        <p>Redirecting you to login...</p>
                    </div>
                );
            
            case 'error':
                return (
                    <div className="verification-status error">
                        <div className="error-icon">✕</div>
                        <h2>Verification Failed</h2>
                        <p>{error}</p>
                        <button 
                            onClick={() => navigate('/signup', {
                                replace: true,
                                state: { 
                                    message: 'Please try signing up again to receive a new verification link.'
                                }
                            })}
                            className="verify-proceed-button"
                            style={{ backgroundColor: '#f44336' }}
                        >
                            Back to Sign Up
                        </button>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="verify-email-container">
            <div className="verify-email-box">
                {renderContent()}
            </div>
        </div>
    );
};

export default AuthCallback; 