import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { userAuth } from '../contexts/AuthContext';
import '../css/ResetPassword.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { updatePassword } = userAuth();

    const [passwordRequirements, setPasswordRequirements] = useState({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    const validatePassword = (password) => {
        setPasswordRequirements({
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (!passwordRequirements.minLength || !passwordRequirements.hasUpperCase || 
            !passwordRequirements.hasLowerCase || !passwordRequirements.hasNumber || 
            !passwordRequirements.hasSpecialChar) {
            setError('Password does not meet the requirements');
            setIsLoading(false);
            return;
        }

        try {
            await updatePassword(password);
            setSuccess('Password has been reset successfully');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getRequirementColor = (isValid) => isValid ? 'valid' : 'invalid';

    return (
        <div className="reset-password-container">
            <div className="reset-password-box">
                <h1>Reset Your Password</h1>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="password">New Password</label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    validatePassword(e.target.value);
                                }}
                                placeholder="Enter new password"
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
                        <div className="password-requirements">
                            <h4>Password Requirements:</h4>
                            <ul>
                                <li className={getRequirementColor(passwordRequirements.minLength)}>
                                    At least 8 characters long
                                </li>
                                <li className={getRequirementColor(passwordRequirements.hasUpperCase)}>
                                    Contains at least one uppercase letter
                                </li>
                                <li className={getRequirementColor(passwordRequirements.hasLowerCase)}>
                                    Contains at least one lowercase letter
                                </li>
                                <li className={getRequirementColor(passwordRequirements.hasNumber)}>
                                    Contains at least one number
                                </li>
                                <li className={getRequirementColor(passwordRequirements.hasSpecialChar)}>
                                    Contains at least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)
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
                        className="reset-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword; 