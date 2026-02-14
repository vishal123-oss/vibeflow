import jwt from 'jsonwebtoken';
import {
  JWT_SECRET,
  REFRESH_SECRET,
  NODE_ENV,
  // RBAC for token payload (roles/permissions included in JWT for stateless guards)
  Roles,
  RolePermissions,
} from '../constants.js';
import { AuthConstants, StatusCodes } from '../constants.js';

export function asyncHandler(fn) {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function ensureFound(item, message = 'Resource not found') {
  if (!item) {
    const err = new Error(message);
    err.status = StatusCodes.NOT_FOUND;
    throw err;
  }
  return item;
}

// Helper to create access token payload with RBAC data (role + permissions)
// Used in auth tokens and refresh (ensures guards always have current perms from role mapping)
function createAccessTokenPayload(user) {
  // Permissions from RolePermissions map (single source in constants.js)
  const permissions = RolePermissions[user.role] || RolePermissions[Roles.USER]; // fallback to user
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions, // array for permission guard checks (stateless RBAC)
  };
}

export function createAccessToken(user) {
  // Creates signed access token with full RBAC payload (role/permissions)
  // Called by createAuthTokens and refresh for consistency
  return jwt.sign(
    createAccessTokenPayload(user),
    JWT_SECRET,
    { expiresIn: AuthConstants.ACCESS_EXPIRES }
  );
}

export function createAuthTokens(user) {
  // Full tokens for login/signup: access (with RBAC) + refresh
  // Permissions derived from role (admin: all perms, user: CRUD ops)
  // This powers permission/role guards across all APIs for security.
  // Future: support dynamic per-user perms beyond role.
  const accessToken = createAccessToken(user);
  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: AuthConstants.REFRESH_EXPIRES }
  );
  return { accessToken, refreshToken };
}

export function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AuthConstants.MAX_TOKEN_AGE_MS,
  });
}

export { JWT_SECRET, REFRESH_SECRET };

// General utilities to eliminate duplication for IDs and timestamps
export function now() {
  return new Date().toISOString();
}

export function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
