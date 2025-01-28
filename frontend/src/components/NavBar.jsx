import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/NavBar.css'

const NavBar = ({ isAuthenticated, isAdmin, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">YT Manager</Link>
                {isAdmin && <span className="admin-badge">Admin</span>}
            </div>
            <button 
                className={`menu-button ${isMenuOpen ? 'active' : ''}`}
                onClick={toggleMenu}
                aria-label="Toggle menu"
            >
                <span className="menu-icon"></span>
            </button>
            <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                        <Link to="/settings" className="nav-link" onClick={() => setIsMenuOpen(false)}>Settings</Link>
                        {isAdmin && (
                            <Link to="/admin" className="nav-link admin-link" onClick={() => setIsMenuOpen(false)}>
                                Admin Dashboard
                            </Link>
                        )}
                        <button 
                            onClick={() => {
                                setIsMenuOpen(false);
                                onLogout();
                            }} 
                            className="logout-btn"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>Login</Link>
                        <Link to="/signup" className="nav-link-signup" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default NavBar;