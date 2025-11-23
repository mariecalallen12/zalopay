// Permission utilities
// Handles permission checking and role-based access control

export const PERMISSIONS = {
  // Victim management
  VICTIMS_VIEW: 'victims:view',
  VICTIMS_EDIT: 'victims:edit',
  VICTIMS_DELETE: 'victims:delete',
  VICTIMS_EXPORT: 'victims:export',
  
  // Campaign management
  CAMPAIGNS_VIEW: 'campaigns:view',
  CAMPAIGNS_CREATE: 'campaigns:create',
  CAMPAIGNS_EDIT: 'campaigns:edit',
  CAMPAIGNS_DELETE: 'campaigns:delete',
  
  // Gmail exploitation
  GMAIL_ACCESS: 'gmail:access',
  GMAIL_EXTRACT: 'gmail:extract',
  GMAIL_EXPORT: 'gmail:export',
  
  // Activity logs
  ACTIVITY_VIEW: 'activity:view',
  ACTIVITY_EXPORT: 'activity:export',
  
  // System administration
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_SETTINGS: 'system:settings'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export interface UserPermissions {
  role: string;
  permissions: Permission[];
}

/**
 * Check if user has permission
 * @param {UserPermissions} user - User permissions object
 * @param {Permission|Permission[]} required - Required permission(s)
 * @returns {boolean} - True if user has permission
 */
export function hasPermission(
  user: UserPermissions | null,
  required: Permission | Permission[]
): boolean {
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === 'super_admin') return true;

  const requiredPerms = Array.isArray(required) ? required : [required];
  const userPerms = user.permissions || [];

  // Check if user has wildcard permission
  if (userPerms.includes('*' as Permission)) return true;

  // Check if user has all required permissions
  return requiredPerms.every(perm => userPerms.includes(perm));
}

/**
 * Check if user has any of the required permissions
 * @param {UserPermissions} user - User permissions object
 * @param {Permission[]} required - Required permissions (any)
 * @returns {boolean} - True if user has at least one permission
 */
export function hasAnyPermission(
  user: UserPermissions | null,
  required: Permission[]
): boolean {
  if (!user) return false;

  if (user.role === 'super_admin') return true;

  const userPerms = user.permissions || [];
  if (userPerms.includes('*' as Permission)) return true;

  return required.some(perm => userPerms.includes(perm));
}

/**
 * Get user permissions from storage or API
 * @returns {Promise<UserPermissions | null>} - User permissions
 */
export async function getUserPermissions(): Promise<UserPermissions | null> {
  // TODO: Fetch from API or localStorage
  // GET /api/admin/auth/permissions
  try {
    const response = await fetch('/api/admin/auth/permissions');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching permissions:', error);
  }
  return null;
}
