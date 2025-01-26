import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/SignUp.css';

const SignUp = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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
      // Basic validation
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error('Please fill in all fields');
      }
      
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // TODO: Replace with actual API call
      // Simulating a successful signup
      localStorage.setItem('token', 'dummy-token');
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error creating account');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1>Create Account</h1>
        <p className="subtitle">Please fill in your details to sign up</p>
        
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" className="signup-button">
            Create Account
          </button>
        </form>

        <p className="login-prompt">
          Already have an account?{' '}
          <Link to="/login" className="login-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
