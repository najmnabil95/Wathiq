import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

// ── Lazy Loaded Pages for Performance & Bundle Splitting ─────────
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const DocumentsPage      = lazy(() => import('./pages/DocumentsPage'));
const DocumentDetailPage = lazy(() => import('./pages/DocumentDetailPage'));
const CreateDocumentPage = lazy(() => import('./pages/CreateDocumentPage'));
const CategoriesPage     = lazy(() => import('./pages/CategoriesPage'));
const DepartmentsPage    = lazy(() => import('./pages/DepartmentsPage'));
const UsersPage          = lazy(() => import('./pages/UsersPage'));
const RolesPage          = lazy(() => import('./pages/RolesPage'));
const AuditPage          = lazy(() => import('./pages/AuditPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));

// ── Loading Fallback ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="w-9 h-9 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium">جاري التحميل...</span>
    </div>
  );
}

// ── Protected Route ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore();
  const isAuthenticated = Boolean(token && user && user.id);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ── Public Route (redirect if logged in) ────────────────────────
function PublicRoute({ children }) {
  const { token, user } = useAuthStore();
  const isAuthenticated = Boolean(token && user && user.id);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
          <Route path="profile"          element={<ProfilePage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
