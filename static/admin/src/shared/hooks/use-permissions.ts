// usePermissions Hook
// Provides permission checking functionality

import { useMemo } from 'react';
import { AuthService } from '../lib/auth';

interface UserPermissions {
  permissions: string[];
  role: string;
}

let cachedPermissions: UserPermissions | null = null;

export function usePermissions() {
  const permissions = useMemo(() => {
    // Try to get from cache first
    if (cachedPermissions) {
      return cachedPermissions;
    }

    // Try to get from AuthService
    try {
      const user = AuthService.getUser();
      if (user && user.permissions) {
        cachedPermissions = {
          permissions: user.permissions || [],
          role: user.role || 'viewer',
        };
        return cachedPermissions;
      }
    } catch (error) {
      console.warn('Failed to get permissions from AuthService:', error);
    }

    // Default permissions (viewer role)
    return {
      permissions: [],
      role: 'viewer',
    };
  }, []);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    // Super admin has all permissions
    if (permissions.role === 'super_admin') {
      return true;
    }

    return permissions.permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(p => hasPermission(p));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(p => hasPermission(p));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    return permissions.role === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.includes(permissions.role);
  };

  /**
   * Check if user role is at least the specified level
   * Role hierarchy: viewer < operator < senior_operator < admin < super_admin
   */
  const hasMinimumRole = (minimumRole: string): boolean => {
    const roleHierarchy = ['viewer', 'operator', 'senior_operator', 'admin', 'super_admin'];
    const userRoleIndex = roleHierarchy.indexOf(permissions.role);
    const minimumRoleIndex = roleHierarchy.indexOf(minimumRole);

    if (userRoleIndex === -1 || minimumRoleIndex === -1) {
      return false;
    }

    return userRoleIndex >= minimumRoleIndex;
  };

  return {
    permissions: permissions.permissions,
    role: permissions.role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasMinimumRole,
  };
}
