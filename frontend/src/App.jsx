import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar'
import AuthNavBar from './components/AuthNavBar'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Public Route Component (accessible only when not logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : children;
};

// Protected Route Component (accessible only when logged in)
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

// Layout wrapper component
const AppLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = ['/login', '/signup', '/verify-email'].includes(location.pathname);

  return (
    <div className="app">
      {isAuthPage ? <AuthNavBar /> : <NavBar />}
      <div className="app-container">
          {!isAuthPage && user && <Sidebar />}
        <main className={`main-content ${isAuthPage ? 'auth-page' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />
            <Route
              path="/verify-email"
              element={<VerifyEmail />}
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
            <AppLayout />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;