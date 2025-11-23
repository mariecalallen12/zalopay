// Admin authentication middleware
const jwt = require('jsonwebtoken');
const AdminUserRepository = require('../repositories/adminUserRepository');

const adminUserRepository = new AdminUserRepository();

/**
 * Authenticate admin user via JWT token
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const admin = await adminUserRepository.findById(decoded.userId);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive admin user' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

/**
 * Check if admin has required permission
 * @param {string|Array} requiredPermissions - Required permission(s)
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    const userPermissions = req.admin.permissions || [];
    const hasPermission = permissions.some(perm => 
      userPermissions.includes(perm) || 
      userPermissions.includes('*') ||
      req.admin.role === 'super_admin'
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateAdmin,
  requirePermission
};
