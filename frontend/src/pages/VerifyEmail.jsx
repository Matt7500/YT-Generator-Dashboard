import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import '../css/VerifyEmail.css';

const VerifyEmail = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleEmailVerification = async () => {
            const hash = window.location.hash;
            if (hash) {
                const hashParams = new URLSearchParams(hash.substring(1));
                const token = hashParams.get('access_token');
                
                if (token) {
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: token,
                        type: 'email'
                    });

                    if (!error) {
                        // Successfully verified email
                        navigate('/dashboard');
                        return;
                    }
                }
            }
        };

        handleEmailVerification();
    }, [navigate]);

    return (
        <div className="verify-email-container">
            <div className="verify-email-box">
                <h1>Check Your Email</h1>
                <p className="email-sent-to">
                    We've sent a verification link to your email address
                </p>
                <div className="instructions">
                    <h2>Next Steps:</h2>
                    <ol>
                        <li>Check your email inbox</li>
                        <li>Check your spam/junk folder if not found in inbox</li>
                        <li>Click the verification link in the email</li>
                        <li>Once verified, you'll be able to sign in</li>
                    </ol>
                </div>
                <div className="help-text">
                    <p>
                        Didn't receive the email? Check your spam folder or{' '}
                        <Link to="/signup" className="resend-link">try signing up again</Link>
                    </p>
                </div>
                <div className="navigation-links">
                    <Link to="/login" className="login-link">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail; 