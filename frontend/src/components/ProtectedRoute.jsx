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
    const { session, isLoading, initialRoute } = userAuth();
    const location = useLocation();
    
    if (isLoading) {
        return <LoadingScreen />;
    }
    
    if (!session) {
        // Save the attempted route
        sessionStorage.setItem('attemptedRoute', location.pathname);
        return <Navigate to="/login" />;
    }

    // If we have an initial route and we're at the root, redirect to it
    if (initialRoute && location.pathname === '/') {
        return <Navigate to={initialRoute} replace />;
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