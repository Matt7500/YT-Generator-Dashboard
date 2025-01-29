import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import '../css/NavBar.css';

const NavBar = () => {
    const { user, userProfile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const closeTimeoutRef = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                if (isDropdownOpen) {
                    handleDropdownToggle();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Get display name from profile or email
    const getDisplayName = () => {
        const capitalizeWords = (str) => {
            return str.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        };

        if (userProfile?.name) return capitalizeWords(userProfile.name);
        if (user?.email) {
            // Extract name from email and capitalize (e.g., "John" from "john@example.com")
            const name = user.email.split('@')[0];
            return capitalizeWords(name);
        }
        return 'there'; // Fallback
    };

    const isAdmin = userProfile?.role === 'admin';

    console.log('NavBar render:', { 
        user, 
        userProfile, 
        isAdmin,
        userRole: userProfile?.role || 'no role'
    });

    const handleDropdownToggle = () => {
        if (isDropdownOpen) {
            setIsClosing(true);
            closeTimeoutRef.current = setTimeout(() => {
                setIsDropdownOpen(false);
                setIsClosing(false);
            }, 200); // Match this with the animation duration
        } else {
            setIsDropdownOpen(true);
        }
    };

    const handleSignOut = async () => {
        try {
            handleDropdownToggle(); // Close dropdown first
            const { error } = await signOut();
            
            if (error) {
                console.error('Error signing out:', error);
                return;
            }

            // Clear any remaining auth state
            window.localStorage.clear();
            
            // Force a complete page reload and navigation
            window.location.replace('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleSettingsClick = () => {
        handleDropdownToggle();
    };

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return (
        <nav className="navbar">
            <div className="brand">
                <Link to="/" className="logo">YT Manager</Link>
            </div>
            
            <div className="welcome-message">
                Welcome, {getDisplayName()}!
            </div>
            
            <div className="profile-section">
                {user ? (
                    <div className="profile-dropdown" ref={dropdownRef}>
                        {isAdmin && <span className="admin-badge">Admin</span>}
                        <button 
                            className="profile-button"
                            onClick={handleDropdownToggle}
                        >
                            <svg
                                className="account-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                                    fill="currentColor"
                                />
                            </svg>
                            <span className="profile-label">Account</span>
                            <svg
                                className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2.5 4.5L6 8L9.5 4.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        {isDropdownOpen && (
                            <div className={`dropdown-menu ${isClosing ? 'closing' : ''}`}>
                                <div className="dropdown-user-info">
                                    <div className="user-name">{getDisplayName()}</div>
                                    <div className="user-email">{user?.email}</div>
                                </div>
                                <div className="dropdown-divider"></div>
                                {isAdmin && (
                                    <>
                                        <Link to="/admin-dashboard" className="dropdown-item">
                                            Admin Dashboard
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                    </>
                                )}
                                <Link to="/settings" className="dropdown-item" onClick={handleSettingsClick}>
                                    Settings
                                </Link>
                                <button onClick={toggleTheme} className="dropdown-item theme-toggle">
                                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                </button>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleSignOut} className="dropdown-item sign-out-btn">
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="auth-buttons">
                        <Link to="/login" className="login-btn">
                            Log In
                        </Link>
                        <Link to="/signup" className="signup-btn">
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;