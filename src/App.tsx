import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { JobsProvider } from './context/JobsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateJob from './pages/CreateJob';
import Profile from './pages/Profile';
import JobDetails from './pages/JobDetails';
import Admin from './pages/Admin';
import UserProfile from './pages/UserProfile';
import { useNotifications } from './hooks/useNotifications';

// Polls for new notifications and fires browser push notifications
function NotificationPoller() {
  useNotifications();
  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  const publicPaths = ['/login', '/register'];
  if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <AuthGuard>
      <NotificationPoller />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/job/:id" element={<JobDetails />} />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/create" element={<CreateJob />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <JobsProvider>
          <AppRoutes />
        </JobsProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
