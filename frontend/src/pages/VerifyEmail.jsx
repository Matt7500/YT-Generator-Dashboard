import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import '../css/VerifyEmail.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [verificationStatus, setVerificationStatus] = useState('verifying');
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const token = searchParams.get('token');
                const userId = searchParams.get('userId');

                if (!token || !userId) {
                    setVerificationStatus('error');
                    setError('Invalid verification link');
                    return;
                }

                const response = await fetch(
                    `http://localhost:5000/api/auth/verify-email?token=${token}&userId=${userId}`,
                    {
                        method: 'GET',
                        credentials: 'include'
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Verification failed');
                }

                setVerificationStatus('success');
            } catch (err) {
                console.error('Verification error:', err);
                setVerificationStatus('error');
                setError(err.message || 'Error verifying email');
            }
        };

        verifyEmail();
    }, [searchParams]);

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
                        <Link to="/login" className="verify-proceed-button">
                            Proceed to Login
                        </Link>
                    </div>
                );
            
            case 'error':
                return (
                    <div className="verification-status error">
                        <div className="error-icon">✕</div>
                        <h2>Verification Failed</h2>
                        <p>{error}</p>
                        <p>
                            If you're having trouble, you can request a new verification link on the{' '}
                            <Link to="/login" className="verify-text-link">
                                login page
                            </Link>
                            .
                        </p>
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

export default VerifyEmail; 