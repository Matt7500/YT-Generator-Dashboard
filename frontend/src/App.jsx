import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Dashboard from './pages/Home'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import PasswordReset from './pages/PasswordReset'
import { useState } from 'react'

// Protected Route Component for admin-only routes
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('token') !== null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    setIsAdmin(false);
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
            {/* Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <Dashboard />
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
                  <SignUp setIsAuthenticated={setIsAuthenticated} />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <PasswordReset />
                </PublicRoute>
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