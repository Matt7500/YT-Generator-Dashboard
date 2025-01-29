import { Navigate } from 'react-router-dom';
import { userAuth } from '../contexts/AuthContext';

// Protected route for authenticated users
export const ProtectedRoute = ({ children }) => {
    const { session } = userAuth();
    
    if (!session) {
        return <Navigate to="/login" />;
    }
    
    return children;
};

// Auth route for non-authenticated users (login, signup, forgot password, etc.)
export const AuthRoute = ({ children }) => {
    const { session } = userAuth();
    
    if (session) {
        return <Navigate to="/" />;
    }
    
    return children;
};

// Special route for OAuth callbacks that doesn't redirect
export const CallbackRoute = ({ children }) => {
    return children;
}; 