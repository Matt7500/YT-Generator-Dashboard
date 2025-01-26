import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Login.css';

const Login = ({ setIsAuthenticated, setIsAdmin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
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
    
    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // TODO: Replace with actual API call
      // For demo purposes, check if it's an admin login
      if (formData.email === 'admin@example.com' && formData.password === 'admin123') {
        // Store admin token and status
        localStorage.setItem('token', 'admin-token');
        localStorage.setItem('isAdmin', 'true');
        setIsAuthenticated(true);
        setIsAdmin(true);
        navigate('/dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Welcome Back</h1>
        <p className="subtitle">Please enter your admin credentials to sign in</p>
        
        <form onSubmit={handleSubmit}>
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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/reset-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        <p className="signup-prompt">
          Don't have an account?{' '}
          <Link to="/signup" className="signup-link">
            Sign up
          </Link>
        </p>

        {/* Add demo credentials hint */}
        <div className="demo-credentials">
          <p>Demo Admin Credentials:</p>
          <code>Email: admin@example.com</code>
          <br />
          <code>Password: admin123</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
