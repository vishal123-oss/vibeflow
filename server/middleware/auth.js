import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/helpers.js';
import { StatusCodes } from '../constants.js';

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
    req.user = user;
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
