import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import CreateDocumentPage from './pages/CreateDocumentPage';
import CategoriesPage from './pages/CategoriesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';
import ErrorBoundary from './components/common/ErrorBoundary';

// ── Protected Route ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}

// ── Public Route (redirect if logged in) ────────────────────────
function PublicRoute({ children }) {
  const { token, user } = useAuthStore();
  if (token && user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />

      {/* Protected — inside layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <AppLayout />
          </ErrorBoundary>
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="documents"        element={<DocumentsPage />} />
        <Route path="documents/create" element={<CreateDocumentPage />} />
        <Route path="documents/:id"    element={<DocumentDetailPage />} />
        <Route path="categories"       element={<CategoriesPage />} />
        <Route path="departments"      element={<DepartmentsPage />} />
        <Route path="users"            element={<UsersPage />} />
        <Route path="roles"            element={<RolesPage />} />
        <Route path="audit"            element={<AuditPage />} />
        <Route path="settings"         element={<SettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
