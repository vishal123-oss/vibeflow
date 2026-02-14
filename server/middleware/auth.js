import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/helpers.js';
import { StatusCodes } from '../constants.js';
// Scoped stores for workspace-aware guards (RBAC extension)
import * as workspaceStore from '../data/workspaces.js';

// RBAC guards for the permission/role-based access control system
// Now powered by FS 'DB' (data/roles.js + data/permissions.js - no constants elsewhere)
// authenticateToken: base auth + attaches user (incl. role/permissions from JWT payload loaded via helpers)
// authorizeRole: simple role check (e.g., admin-only for resets)
// authorizePermission: granular perm check (main guard for all APIs; perms from role in data/ DB)
// If user lacks perm/role: 403 Forbidden; integrates with errorHandler.
// All roles/perms read from FS entity files (e.g., roles-admin.json embeds perm IDs).

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

// New guards for scoped 'who can access what' RBAC (per req)
// SuperAdmin: only for global CRUD on roles/perms/workspaces/users
export function authorizeSuperAdmin() {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
      const err = new Error('SuperAdmin required for global CRUD (roles, permissions, workspaces)');
      err.status = StatusCodes.FORBIDDEN;
      return next(err);
    }
    next();
  };
}

// Workspace scoped: workspace_admin/owner for inside actions (create users, assign roles/perms scoped)
// SuperAdmin bypasses; uses workspace.members or ownerId from data/workspaces DB
export function authorizeWorkspaceAccess(workspaceIdParam = 'workspaceId', requiredRole = 'workspace_admin') {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params[workspaceIdParam];
      if (!workspaceId) {
        const err = new Error('Workspace ID required');
        err.status = StatusCodes.BAD_REQUEST;
        return next(err);
      }
      const ws = await workspaceStore.getWorkspaceById(workspaceId);
      if (!ws) {
        const err = new Error('Workspace not found');
        err.status = StatusCodes.NOT_FOUND;
        return next(err);
      }
      // SuperAdmin always bypasses scoped checks
      if (req.user.role === 'super_admin') {
        req.workspace = ws;
        return next();
      }
      // Check owner or member with required role
      const isOwner = ws.ownerId === req.user.id;
      const member = (ws.members || []).find(m => m.userId === req.user.id);
      const hasAccess = isOwner || (member && member.role === requiredRole);
      if (!hasAccess) {
        const err = new Error(`Insufficient workspace access: ${requiredRole} or owner required`);
        err.status = StatusCodes.FORBIDDEN;
        return next(err);
      }
      req.workspace = ws; // attach for handlers
      next();
    } catch (e) {
      next(e);
    }
  };
}
