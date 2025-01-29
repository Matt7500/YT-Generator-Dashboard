import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { useState } from 'react';
import { userAuth } from '../contexts/AuthContext';
import supabase from '../clients/supabaseClient';
import '../css/Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    
    const { signIn, signInWithGoogle } = userAuth();

    const updateAllChannelStats = async (userId) => {
        try {
            // Get all channels for the user
            const { data: channels, error: channelsError } = await supabase
                .from('youtube_accounts')
                .select('channel_id')
                .eq('user_id', userId);

            if (channelsError) throw channelsError;

            // Update stats for each channel
            const updatePromises = channels.map(channel => 
                fetch(`/api/youtube/channels/${channel.channel_id}/stats`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId })
                })
            );

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error updating channel statistics:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data, error } = await signIn({ email, password });
            if (error) throw error;
            
            // Update channel statistics after successful login
            await updateAllChannelStats(data.user.id);
            
            navigate('/dashboard');
        } catch (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            // The redirect will be handled by Supabase
        } catch (error) {
            setError(error.message);
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Welcome Back</h1>
                <p className="subtitle">Please enter your details to sign in</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-options">
                        <div className="remember-me">
                            <input
                                type="checkbox"
                                id="remember"
                                name="remember"
                            />
                            <label htmlFor="remember">Remember me</label>
                        </div>
                        <Link to="/forgot-password" className="forgot-password">
                            Forgot password?
                        </Link>
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <div className="divider">
                        <span>or</span>
                    </div>

                    <button
                        type="button"
                        className="google-login-button"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                    >
                        <FaGoogle />
                        {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                    </button>
                </form>

                <p className="signup-prompt">
                    Don't have an account?{' '}
                    <Link to="/signup" className="signup-link">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
