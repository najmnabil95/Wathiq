import { useAuthStore } from '../../store/authStore';

/**
 * Declarative RBAC authorization component.
 *
 * Usage:
 *   <Can permission="documents.create">
 *     <button>وثيقة جديدة</button>
 *   </Can>
 *
 *   <Can any={['roles.view', 'roles.manage']}>
 *     <RolesSection />
 *   </Can>
 *
 *   <Can permission="documents.approve" fallback={<span>غير مصرح</span>}>
 *     <ApproveButton />
 *   </Can>
 */
export default function Can({
  permission,
  any: anyPermissions,
  all: allPermissions,
  role,
  fallback = null,
  children,
}) {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuthStore();

  if (!user) return fallback;

  // Super admin bypasses all permission checks
  if (user.is_super_admin) return children;

  if (role && !hasRole(role)) {
    return fallback;
  }

  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  if (anyPermissions && !hasAnyPermission(anyPermissions)) {
    return fallback;
  }

  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return fallback;
  }

  return children;
}
