// Permission Guard Component
// Conditionally renders children based on user permissions

import React from 'react';
import { usePermissions } from '../../hooks/use-permissions';

interface PermissionGuardProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireAll?: boolean; // If true, requires all permissions; if false, requires any permission
}

export function PermissionGuard({
  permission,
  fallback = null,
  children,
  requireAll = false,
}: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll
    ? permissions.every(p => hasPermission(p))
    : permissions.some(p => hasPermission(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  role: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireAll?: boolean;
}

export function RoleGuard({
  role,
  fallback = null,
  children,
  requireAll = false,
}: RoleGuardProps) {
  const { hasRole } = usePermissions();

  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = requireAll
    ? roles.every(r => hasRole(r))
    : roles.some(r => hasRole(r));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
