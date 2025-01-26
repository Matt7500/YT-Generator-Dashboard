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
  // Check both localStorage and cookies for authentication
  const isAuthenticated = localStorage.getItem('user') !== null;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
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
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('user') !== null);
  const [isAdmin, setIsAdmin] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
  });

  useEffect(() => {
    // Check authentication status when component mounts
    const user = localStorage.getItem('user');
    if (user) {
      setIsAuthenticated(true);
      setIsAdmin(JSON.parse(user).role === 'admin');
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Router>
      <div className="app-container">
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
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Admin Routes */}
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