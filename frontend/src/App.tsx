import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Import Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CodeWorkspace from './pages/CodeWorkspace';
import AIChat from './pages/AIChat';
import Analytics from './pages/Analytics';
import HistoryLog from './pages/History';
import GitHubConnect from './pages/GitHubConnect';
import ProfileSettings from './pages/ProfileSettings';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Toast Banner Overlay
import ToastContainer from './components/ui/ToastContainer';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-purple-500">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-primary"></div>
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Admin Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-purple-500">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-primary"></div>
      </div>
    );
  }
  return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth Tabs */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Authenticated Dashboard Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Multi-Tab Monaco Code Editor Workspace */}
      <Route
        path="/workspace"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CodeWorkspace />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Dynamic AI Chat Screen */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AIChat />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Usage Analytics and Charts */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Operations History Log */}
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <HistoryLog />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* GitHub Account Connect & Scans */}
      <Route
        path="/github"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <GitHubConnect />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Profile & Custom API Key Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProfileSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Administrative Panel */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </AdminRoute>
        }
      />

      {/* 404 Route */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <WorkspaceProvider>
          <NotificationProvider>
            <AppRoutes />
            <ToastContainer />
          </NotificationProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
