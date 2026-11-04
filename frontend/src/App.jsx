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
const DocumentTypesPage  = lazy(() => import('./pages/DocumentTypesPage'));
const DepartmentsPage    = lazy(() => import('./pages/DepartmentsPage'));
const OrganizationsPage  = lazy(() => import('./pages/OrganizationsPage'));
const UsersPage          = lazy(() => import('./pages/UsersPage'));
const RolesPage          = lazy(() => import('./pages/RolesPage'));
const AuditPage          = lazy(() => import('./pages/AuditPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));
const WorkflowsPage      = lazy(() => import('./pages/WorkflowsPage'));
const DispositionPage    = lazy(() => import('./pages/DispositionPage'));
const SystemFlowPage     = lazy(() => import('./pages/SystemFlowPage'));

// ── Loading Fallback ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="w-9 h-9 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium">جاري التحميل...</span>
    </div>
  );
}

import UnauthorizedPage from './components/common/UnauthorizedPage';

// ── Protected Route ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore();
  const isAuthenticated = Boolean(token && user && user.id);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// ── Permission Guard for Routes ─────────────────────────────────
function RequirePermission({ permission, any: anyPermissions, children }) {
  const { user, hasPermission, hasAnyPermission } = useAuthStore();
  const isSuperAdmin = user?.is_super_admin || user?.roles?.some(r => r.name === 'super_admin');

  if (isSuperAdmin) return children;

  if (permission && !hasPermission(permission)) {
    return <UnauthorizedPage requiredPermission={permission} />;
  }

  if (anyPermissions && !hasAnyPermission(anyPermissions)) {
    return <UnauthorizedPage requiredPermission={anyPermissions.join(' / ')} />;
  }

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
          <Route path="documents" element={
            <RequirePermission permission="documents.view">
              <DocumentsPage />
            </RequirePermission>
          } />
          <Route path="documents/create" element={
            <RequirePermission permission="documents.create">
              <CreateDocumentPage />
            </RequirePermission>
          } />
          <Route path="documents/:id" element={
            <RequirePermission permission="documents.view">
              <DocumentDetailPage />
            </RequirePermission>
          } />
          <Route path="disposition" element={
            <RequirePermission permission="disposition.manage">
              <DispositionPage />
            </RequirePermission>
          } />
          <Route path="categories" element={
            <RequirePermission permission="categories.view">
              <CategoriesPage />
            </RequirePermission>
          } />
          <Route path="document-types" element={
            <RequirePermission any={['document-types.view', 'document-types.manage']}>
              <DocumentTypesPage />
            </RequirePermission>
          } />
          <Route path="departments" element={
            <RequirePermission permission="departments.view">
              <DepartmentsPage />
            </RequirePermission>
          } />
          <Route path="organizations" element={
            <RequirePermission permission="organizations.view">
              <OrganizationsPage />
            </RequirePermission>
          } />
          <Route path="users" element={
            <RequirePermission permission="users.view">
              <UsersPage />
            </RequirePermission>
          } />
          <Route path="roles" element={
            <RequirePermission any={['roles.view', 'roles.manage']}>
              <RolesPage />
            </RequirePermission>
          } />
          <Route path="audit" element={
            <RequirePermission permission="audit.view">
              <AuditPage />
            </RequirePermission>
          } />
          <Route path="workflows" element={
            <RequirePermission any={['workflows.view', 'workflows.manage']}>
              <WorkflowsPage />
            </RequirePermission>
          } />
          <Route path="settings" element={
            <RequirePermission permission="settings.view">
              <SettingsPage />
            </RequirePermission>
          } />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="system-flow" element={<SystemFlowPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
