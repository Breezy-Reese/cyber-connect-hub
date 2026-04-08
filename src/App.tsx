// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

const ToasterWithTheme = () => {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? '#0f1525' : '#ffffff',
          color: isDark ? '#e2e8f0' : '#0f172a',
          border: `1px solid ${isDark ? '#1e2d4a' : '#e2e8f0'}`,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.85rem',
        },
        success: { iconTheme: { primary: '#10b981', secondary: isDark ? '#0f1525' : '#ffffff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: isDark ? '#0f1525' : '#ffffff' } },
      }}
    />
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToasterWithTheme />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="client"><ClientDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
