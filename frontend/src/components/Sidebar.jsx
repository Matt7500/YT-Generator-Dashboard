import { Link, useLocation } from 'react-router-dom';
import '../css/Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();

    const handleLinkClick = () => {
        onClose(); // Close sidebar when a link is clicked
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div 
                    className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                    onClick={onClose}
                />
            )}
            
            {/* Sidebar */}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h1>Channel Manager</h1>
                </div>
                
                <nav className="sidebar-nav">
                    <Link 
                        to="/dashboard" 
                        className={`nav-item ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        Dashboard
                    </Link>
                    <Link 
                        to="/story-writer" 
                        className={`nav-item ${location.pathname === '/story-writer' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        Story Writer
                    </Link>
                    <Link 
                        to="/stories" 
                        className={`nav-item ${location.pathname === '/stories' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        Stories
                    </Link>
                    <Link 
                        to="/channels" 
                        className={`nav-item ${location.pathname === '/channels' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        Channels
                    </Link>
                    <Link 
                        to="/analytics" 
                        className={`nav-item ${location.pathname === '/analytics' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        Analytics
                    </Link>
                    <Link 
                        to="/settings" 
                        className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        Settings
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button className="create-all-btn" onClick={handleLinkClick}>
                        Create For All
                    </button>
                    <Link 
                        to="/edit-channels" 
                        className={`edit-channels-link ${location.pathname === '/edit-channels' ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        Edit Channels
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Sidebar; 