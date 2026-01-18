import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Temporadas from './pages/Temporadas';
import Admin from './pages/Admin';
import Prova from './pages/Prova';

// Protected Route Component
function PrivateRoute({ children }) {
  const { signed, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-aec-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return signed ? children : <Navigate to="/login" />;
}

// Admin Route Component
function AdminRoute({ children }) {
  const { signed, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-aec-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!signed) return <Navigate to="/login" />;
  if (!isAdmin()) return <Navigate to="/temporadas" />;

  return children;
}

// Public Route (redirect if logged)
function PublicRoute({ children }) {
  const { signed, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-aec-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return !signed ? children : <Navigate to="/temporadas" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/temporadas" element={
        <PrivateRoute>
          <Temporadas />
        </PrivateRoute>
      } />
      <Route path="/prova/:id" element={
        <PrivateRoute>
          <Prova />
        </PrivateRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <Admin />
        </AdminRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
