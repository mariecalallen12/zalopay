// Authentication middleware helpers
const jwt = require('jsonwebtoken');
const AdminUserRepository = require('../repositories/adminUserRepository');
const config = require('../config');
const { AuthenticationError } = require('../utils/errors');

const adminUserRepository = new AdminUserRepository();

/**
 * Extract bearer token from request headers
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Core JWT verification logic
 */
function verifyToken(req, next, { optional = false } = {}) {
  const token = extractBearerToken(req);

  if (!token) {
    if (optional) {
      return next();
    }
    return next(new AuthenticationError('Authentication token required'));
  }

  jwt.verify(token, config.security.jwtSecret, (err, decoded) => {
    if (err) {
      if (optional) {
        return next();
      }
      return next(new AuthenticationError('Invalid or expired token'));
    }

    req.user = decoded;
    next();
  });
}

/**
 * Strict authentication middleware
 */
const authenticateToken = (req, res, next) => {
  verifyToken(req, next, { optional: false });
};

/**
 * Optional authentication middleware
 */
const optionalAuth = (req, res, next) => {
  verifyToken(req, next, { optional: true });
};

/**
 * Helper to generate JWT tokens for device/auth flows
 */
const generateToken = (payload, options = {}) => {
  return jwt.sign(payload, config.security.jwtSecret, {
    expiresIn: config.security.jwtExpiresIn,
    ...options,
  });
};

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
    const decoded = jwt.verify(token, config.security.jwtSecret);
    
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
  authenticateToken,
  optionalAuth,
  generateToken,
  authenticateAdmin,
  requirePermission
};
