import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AuthNavBar from './components/AuthNavBar';
import { ProtectedRoute, AuthRoute, CallbackRoute } from './components/ProtectedRoute';
import { AuthContextProvider, userAuth } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import YouTubeCallback from './pages/YouTubeCallback';
import AuthCallback from './pages/AuthCallback';
import StoryWriter from './pages/StoryWriter';

// Loading screen component
const LoadingScreen = () => {
  const { theme } = useTheme();
  return (
    <div className={`loading-screen ${theme}`}>
      <div className="loading-spinner"></div>
    </div>
  );
};

// Layout wrapper component
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Save the current path when it changes
  useEffect(() => {
    if (!isAuthPage && location.pathname !== '/') {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [location.pathname, isAuthPage]);

  // Get the last visited path or default to dashboard
  const getDefaultRoute = () => {
    const lastPath = localStorage.getItem('lastPath');
    return lastPath || '/dashboard';
  };

  return (
    <div className="app">
      {isAuthPage ? (
        <AuthNavBar />
      ) : (
        <NavBar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />
      )}
      <div className="app-container">
        {!isAuthPage && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        )}
        <main className={`main-content ${isAuthPage ? 'auth-page' : ''}`}>
          <Routes>
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
            <Route 
              path="/story-writer" 
              element={
                <ProtectedRoute>
                  <StoryWriter />
                </ProtectedRoute>
              } 
            />

            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                <AuthRoute>
                  <Login />
                </AuthRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <AuthRoute>
                  <SignUp />
                </AuthRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <AuthRoute>
                  <ForgotPassword />
                </AuthRoute>
              } 
            />
            <Route 
              path="/reset-password" 
              element={
                <AuthRoute>
                  <ResetPassword />
                </AuthRoute>
              } 
            />

            {/* Callback Routes */}
            <Route 
              path="/auth/callback" 
              element={
                <CallbackRoute>
                  <AuthCallback />
                </CallbackRoute>
              } 
            />
            <Route 
              path="/auth/youtube/callback" 
              element={
                <CallbackRoute>
                  <YouTubeCallback />
                </CallbackRoute>
              } 
            />

            {/* Default Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Navigate to={getDefaultRoute()} replace />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Root component that handles initial auth loading
const AppRoot = () => {
  const { isLoading } = userAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <AppLayout />;
};

function App() {
  return (
    <Router>
      <AuthContextProvider>
        <ThemeProvider>
          <AppRoot />
        </ThemeProvider>
      </AuthContextProvider>
    </Router>
  );
}

export default App;