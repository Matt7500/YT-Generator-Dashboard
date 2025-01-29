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
import { ThemeProvider } from './contexts/ThemeContext';
import AuthNavBar from './components/AuthNavBar';
import { ProtectedRoute, AuthRoute, CallbackRoute } from './components/ProtectedRoute';
import { AuthContextProvider } from './contexts/AuthContext';
import { useState } from 'react';
import YouTubeCallback from './pages/YouTubeCallback';

// Layout wrapper component
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="app">
      {isAuthPage ? <AuthNavBar /> : <NavBar />}
      <div className="app-container">
        {!isAuthPage && <Sidebar />}
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

            {/* Default Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <NavBar />
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/login" replace />} />

            {/* New Route */}
            <Route 
              path="/auth/youtube/callback" 
              element={
                <CallbackRoute>
                  <YouTubeCallback />
                </CallbackRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthContextProvider>
      <ThemeProvider>
        <Router>
          <AppLayout />
        </Router>
      </ThemeProvider>
    </AuthContextProvider>
  );
}

export default App;