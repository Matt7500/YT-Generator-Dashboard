import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/PasswordReset.css';

const PasswordReset = () => {
  const [step, setStep] = useState(1); // 1: Email entry, 2: New password entry
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (!formData.email) {
        throw new Error('Please enter your email');
      }

      // TODO: Replace with actual API call to send reset code
      // Simulating API call success
      setSuccess('Reset code has been sent to your email');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error sending reset code');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (!formData.code || !formData.newPassword || !formData.confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // TODO: Replace with actual API call to reset password
      // Simulating API call success
      setSuccess('Password has been reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error resetting password');
    }
  };

  return (
    <div className="password-reset-container">
      <div className="password-reset-box">
        <h1>Reset Password</h1>
        <p className="subtitle">
          {step === 1 
            ? 'Enter your email to receive a reset code'
            : 'Enter the code sent to your email and your new password'
          }
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <button type="submit" className="reset-button">
              Send Reset Code
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <div className="form-group">
              <label htmlFor="code">Reset Code</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Enter reset code"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" className="reset-button">
              Reset Password
            </button>
          </form>
        )}

        <p className="login-prompt">
          Remember your password?{' '}
          <Link to="/login" className="login-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PasswordReset;
