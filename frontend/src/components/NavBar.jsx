import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import { userAuth } from '../contexts/AuthContext';
import supabase from '../clients/supabaseClient';
import '../css/NavBar.css';

const NavBar = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { signOut, session } = userAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (session?.user?.id) {
            loadUserRole();
        }
    }, [session?.user?.id]);

    const loadUserRole = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;
            setUserRole(data.role);
        } catch (error) {
            console.error('Error loading user role:', error);
        }
    };

    const getDisplayName = () => {
        return session?.user?.user_metadata?.name || "User";
    };

    const isAdmin = () => {
        return userRole === 'admin';
    };

    const closeDropdown = useCallback(() => {
        if (isDropdownOpen) {
            setIsClosing(true);
            setTimeout(() => {
                setIsDropdownOpen(false);
                setIsClosing(false);
            }, 200);
        }
    }, [isDropdownOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isDropdownOpen, closeDropdown]);

    const handleDropdownToggle = () => {
        if (isDropdownOpen) {
            closeDropdown();
        } else {
            setIsDropdownOpen(true);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleSettingsClick = () => {
        closeDropdown();
        navigate('/settings');
    };

    return (
        <nav className="navbar">
            <div className="brand">
                <Link to="/" className="logo">YT Manager</Link>
            </div>
            
            <div className="welcome-message">
                Welcome, {getDisplayName()}!
            </div>
            
            <div className="profile-section">
                <div className="profile-dropdown" ref={dropdownRef}>
                    {isAdmin() && <span className="admin-badge">Admin</span>}
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
                                <div className="user-email">{session?.user?.email}</div>
                            </div>
                            <div className="dropdown-divider"></div>
                            {isAdmin() && (
                                <>
                                    <Link to="/admin-dashboard" className="dropdown-item" onClick={closeDropdown}>
                                        Admin Dashboard
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                </>
                            )}
                            <button onClick={handleSettingsClick} className="dropdown-item">
                                Settings
                            </button>
                            <button onClick={toggleTheme} className="dropdown-item theme-toggle">
                                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </button>
                            <div className="dropdown-divider"></div>
                            <button 
                                className="dropdown-item sign-out-btn"
                                onClick={handleSignOut}
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;