import { Link } from 'react-router-dom';
import '../css/NavBar.css'

const NavBar = ({ isAuthenticated, isAdmin, onLogout }) => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">YT Generator</Link>
                {isAdmin && <span className="admin-badge">Admin</span>}
            </div>
            <div className="navbar-menu">
                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        <Link to="/settings" className="nav-link">Settings</Link>
                        {isAdmin && (
                            <Link to="/admin" className="nav-link admin-link">
                                Admin Dashboard
                            </Link>
                        )}
                        <button onClick={onLogout} className="logout-button">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-link">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    )
}

export default NavBar