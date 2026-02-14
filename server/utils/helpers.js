import jwt from 'jsonwebtoken';
import {
  JWT_SECRET,
  REFRESH_SECRET,
  NODE_ENV,
} from '../constants.js';
import { AuthConstants, StatusCodes } from '../constants.js';
// RBAC now FS-based 'DB' (data/roles.js + data/permissions.js; no constants)
// Import here for token creation (dynamic perms load for stateless JWT guards)
import * as rolesStore from '../data/roles.js';

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

// RBAC token helpers (now loads from FS 'DB' in data/roles.js + data/permissions.js)
// Makes create* async; ensures JWT payload always has up-to-date role/permissions
// Stateless guards still fast (perms embedded); no constants - all from data/ DB.
// Follows boards.js async FS pattern for entity reads.

export async function getAccessTokenPayload(user) {
  // Load role's permissions dynamically from FS 'DB' (e.g., admin gets all possible perms)
  // Fallback to 'user' role for safety/security
  const permissions = await rolesStore.getPermissionsForRole(user.role || 'user');
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    permissions, // array of perm IDs for authorizePermission guard
  };
}

export async function createAccessToken(user) {
  // Async: signed access token with RBAC payload from data/roles DB
  // Called by createAuthTokens/refresh; ensures guards reflect current role perms
  const payload = await getAccessTokenPayload(user);
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: AuthConstants.ACCESS_EXPIRES }
  );
}

export async function createAuthTokens(user) {
  // Full tokens: access (RBAC from FS DB) + refresh
  // Powers all permission guards (e.g., workspace:reset only admin role)
  // Future: cache perms or embed more user data.
  const accessToken = await createAccessToken(user);
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
