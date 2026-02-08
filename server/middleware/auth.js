import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vibeflow-demo-secret-key-change-in-prod';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const err = new Error('Access token required');
    err.status = 401;
    return next(err);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const error = new Error('Invalid token');
      error.status = 403;
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
      err.status = 403;
      return next(err);
    }
    next();
  };
}
