import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import PasswordReset from './pages/PasswordReset'
import VerifyEmail from './pages/VerifyEmail'
import AdminDashboard from './pages/AdminDashboard'
import Settings from './pages/Settings'
import { useState, useEffect } from 'react'
import api from './utils/api'

// Protected Route Component for admin-only routes
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log('Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Protected Route Component for authenticated users
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (isAuthenticated) {
    console.log('Already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a user in localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Verify the token with the backend
        const response = await api.get('/auth/verify');
        if (response.data.authenticated) {
          const user = JSON.parse(userStr);
          setIsAuthenticated(true);
          setIsAdmin(user.role === 'admin');
        } else {
          // Token is invalid, clear localStorage
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <NavBar 
          isAuthenticated={isAuthenticated} 
          isAdmin={isAdmin} 
          onLogout={handleLogout}
        />
        <main className="main-content">
          <Routes>
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard isAuthenticated={isAuthenticated} />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
                </AdminRoute>
              }
            />

            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login setIsAuthenticated={setIsAuthenticated} setIsAdmin={setIsAdmin} />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp setIsAuthenticated={setIsAuthenticated} setIsAdmin={setIsAdmin} />
                </PublicRoute>
              }
            />
            <Route
              path="/verify-email"
              element={<VerifyEmail />}
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <PasswordReset />
                </PublicRoute>
              }
            />

            {/* Settings Route */}
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings isAuthenticated={isAuthenticated} />
                </PrivateRoute>
              }
            />

            {/* Catch all route - redirect to dashboard or login based on auth status */}
            <Route
              path="*"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App