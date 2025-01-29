import { Link } from 'react-router-dom';
import '../css/AuthNavBar.css';

const AuthNavBar = () => {
    return (
        <nav className="auth-navbar">
            <div className="auth-navbar-content">
                <Link to="/" className="auth-logo">
                    YT Manager
                </Link>
                
                <div className="auth-nav-buttons">
                    <Link to="/login" className="auth-nav-btn login">
                        Log In
                    </Link>
                    <Link to="/signup" className="auth-nav-btn signup">
                        Sign Up
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default AuthNavBar; 