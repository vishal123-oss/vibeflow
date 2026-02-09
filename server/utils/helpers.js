import jwt from 'jsonwebtoken';
import {
  JWT_SECRET,
  REFRESH_SECRET,
  NODE_ENV,
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

export function createAuthTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: AuthConstants.ACCESS_EXPIRES }
  );
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
