import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/api';
import '../css/Login.css';

const Login = ({ setIsAuthenticated, setIsAdmin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', formData);
      const data = response.data;
      
      // Store user info in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update authentication state
      setIsAuthenticated(true);
      setIsAdmin(data.user.role === 'admin');

      console.log('Authentication successful, redirecting...'); // Debug log
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Error logging in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Welcome Back</h1>
        <p className="subtitle">Please enter your credentials to sign in</p>
        <div className="login-form">
          <form onSubmit={handleSubmit} >
            {error && <div className="error-message">{error}</div>}
            
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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/reset-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          </form>
        </div>

        <p className="signup-prompt">
          Don't have an account?{' '}
          <Link to="/signup" className="signup-link">
            Sign up
          </Link>
        </p>

        {/* Add demo credentials hint */}
        <div className="demo-credentials">
          <p>Demo Credentials:</p>
          <div className="user-credentials">
            <p><strong>Regular User:</strong></p>
            <code>Email: test@example.com</code>
            <br />
            <code>Password: password123</code>
          </div>
          <div className="admin-credentials">
            <p><strong>Admin User:</strong></p>
            <code>Email: admin@example.com</code>
            <br />
            <code>Password: admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
