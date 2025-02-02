import { Navigate, useLocation } from 'react-router-dom';
import { userAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Loading screen component
const LoadingScreen = () => {
  const { theme } = useTheme();
  return (
    <div className={`loading-screen ${theme}`}>
      <div className="loading-spinner"></div>
    </div>
  );
};

// Protected route for authenticated users
export const ProtectedRoute = ({ children }) => {
    const { session, isLoading } = userAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return <LoadingScreen />;
    }

    // Redirect to login if not authenticated
    if (!session) {
        // Save the attempted URL for redirecting after login
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
};

// Auth route for non-authenticated users (login, signup, forgot password, etc.)
export const AuthRoute = ({ children }) => {
    const { session, isLoading } = userAuth();
    
    if (isLoading) {
        return <LoadingScreen />;
    }
    
    if (session) {
        // Get the attempted route or fall back to the last authenticated route
        const redirectTo = sessionStorage.getItem('attemptedRoute') || 
                         sessionStorage.getItem('lastAuthenticatedRoute') || 
                         '/dashboard';
        // Clean up
        sessionStorage.removeItem('attemptedRoute');
        return <Navigate to={redirectTo} replace />;
    }
    
    return children;
};

// Special route for OAuth callbacks that doesn't redirect
export const CallbackRoute = ({ children }) => {
    return children;
}; 