import { Link, useLocation } from 'react-router-dom';
import '../css/Sidebar.css';

const Sidebar = () => {
    const location = useLocation();

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1>Channel Manager</h1>
            </div>
            
            <nav className="sidebar-nav">
                <Link 
                    to="/channels" 
                    className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                    Channels
                </Link>
                <Link 
                    to="/analytics" 
                    className={`nav-item ${location.pathname === '/analytics' ? 'active' : ''}`}
                >
                    Analytics
                </Link>
            </nav>

            <div className="sidebar-footer">
                <button className="create-all-btn">
                    Create For All
                </button>
                <Link to="/edit-channels" className="edit-channels-link">
                    Edit Channels
                </Link>
            </div>
        </div>
    );
};

export default Sidebar; 