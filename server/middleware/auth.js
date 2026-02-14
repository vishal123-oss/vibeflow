import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/helpers.js';
import { StatusCodes } from '../constants.js';

// RBAC guards for the permission/role-based access control system
// authenticateToken: base auth + attaches user (incl. role/permissions from JWT payload)
// authorizeRole: simple role check (e.g., admin-only for resets)
// authorizePermission: granular perm check (main guard for all APIs as per req)
// Permissions/roles defined in constants.js; embedded in JWT for stateless, secure checks
// If user lacks perm/role: 403 Forbidden; integrates with errorHandler.

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const err = new Error('Access token required');
    err.status = StatusCodes.UNAUTHORIZED;
    return next(err);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const error = new Error('Invalid token');
      error.status = StatusCodes.FORBIDDEN;
      return next(error);
    }
    req.user = user; // includes {id, email, role, permissions: [...] } for guards
    next();
  });
}

export function authorizeRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error('Insufficient permissions');
      err.status = StatusCodes.FORBIDDEN;
      return next(err);
    }
    next();
  };
}

export function authorizePermission(permission) {
  return (req, res, next) => {
    // Check if authenticated user has the required permission in JWT payload
    // This gates each API as specified; ensures role-based perms enforced
    if (!req.user || !req.user.permissions || !req.user.permissions.includes(permission)) {
      const err = new Error(`Insufficient permissions: ${permission} required`);
      err.status = StatusCodes.FORBIDDEN;
      return next(err);
    }
    next();
  };
}
