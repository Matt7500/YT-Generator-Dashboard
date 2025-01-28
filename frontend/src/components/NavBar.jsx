import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/NavBar.css'

const NavBar = ({ isAuthenticated, isAdmin, onLogout, user, activeTab, setActiveTab, setIsOpen }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (isDropdownOpen) setIsDropdownOpen(false);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleCreateAll = () => {
        // TODO: Implement create for all functionality
        console.log('Create for all clicked');
        setIsSidebarOpen(false); // Close sidebar after action on mobile
    };

    const handleEditChannels = () => {
        setIsOpen(true);
        setIsSidebarOpen(false); // Close sidebar after action on mobile
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setIsSidebarOpen(false); // Close sidebar after action on mobile
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <nav className="navbar">
                {/* Hamburger Menu Button */}
                <button 
                    className={`hamburger-menu ${isSidebarOpen ? 'active' : ''}`}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <span className="hamburger-icon"></span>
                </button>

                <div className="navbar-brand">
                    <Link to="/">YT Manager</Link>
                </div>

                {isAuthenticated && (
                    <div className="welcome-message">
                        Welcome, {user?.name || 'User'}!
                    </div>
                )}

                {isAdmin && <span className="admin-badge">Admin</span>}

                {/* Desktop Menu */}
                <div className="navbar-menu desktop-menu">
                    {isAuthenticated ? (
                        <>
                            {isAdmin && (
                                <Link to="/admin" className="nav-link admin-link">
                                    Admin Dashboard
                                </Link>
                            )}
                            <div className="user-dropdown" ref={dropdownRef}>
                                <button 
                                    className="user-dropdown-button"
                                    onClick={toggleDropdown}
                                >
                                    <svg 
                                        className="person-icon"
                                        width="20" 
                                        height="20" 
                                        viewBox="0 0 20 20" 
                                        fill="currentColor"
                                    >
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span>Account</span>
                                    <svg 
                                        className="chevron-icon"
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 20 20" 
                                        fill="currentColor"
                                        style={{
                                            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s ease'
                                        }}
                                    >
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                    </svg>
                                </button>
                                <div className={`user-dropdown-content ${isDropdownOpen ? 'active' : ''}`}>
                                    <div className="dropdown-user-info">
                                        <div className="user-name">{user?.name || 'User'}</div>
                                        <div className="user-email">{user?.email}</div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <Link to="/settings" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                        Settings
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <button 
                                        className="dropdown-item danger"
                                        onClick={onLogout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/signup" className="nav-link-signup">Sign Up</Link>
                        </>
                    )}
                </div>

                {/* Mobile Account Button */}
                {isAuthenticated && (
                    <button 
                        className="mobile-account-button"
                        onClick={toggleMenu}
                    >
                        <svg 
                            className="person-icon"
                            width="24" 
                            height="24" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}

                {/* Mobile Menu */}
                <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
                    {isAuthenticated ? (
                        <div className="mobile-menu-content">
                            <div className="mobile-user-info">
                                <div className="user-name">{user?.name || 'User'}</div>
                                <div className="user-email">{user?.email}</div>
                            </div>
                            {isAdmin && (
                                <Link to="/admin" className="mobile-menu-item admin" onClick={() => setIsMenuOpen(false)}>
                                    Admin Dashboard
                                </Link>
                            )}
                            <Link to="/settings" className="mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
                                Settings
                            </Link>
                            <button 
                                className="mobile-menu-item danger"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    onLogout();
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="mobile-menu-content">
                            <Link to="/login" className="mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
                                Login
                            </Link>
                            <Link to="/signup" className="mobile-menu-item signup" onClick={() => setIsMenuOpen(false)}>
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {isAuthenticated && (
                <div className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
                    <h3 className="sidebar-title">Channel Manager</h3>
                    <div className="sidebar-nav">
                        <div 
                            className={`sidebar-nav-item ${activeTab === 'channels' ? 'active' : ''}`}
                            onClick={() => handleTabClick('channels')}
                        >
                            <span>Channels</span>
                        </div>
                        <div 
                            className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => handleTabClick('analytics')}
                        >
                            <span>Analytics</span>
                        </div>
                    </div>
                    <div className="sidebar-bottom">
                        <button className="create-all-btn" onClick={handleCreateAll}>
                            Create For All
                        </button>
                        <button className="edit-channels-btn" onClick={handleEditChannels}>
                            Edit Channels
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default NavBar;