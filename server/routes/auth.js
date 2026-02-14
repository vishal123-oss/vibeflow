import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as usersStore from '../data/users.js';
import { asyncHandler, createAuthTokens, createAccessToken, setRefreshCookie, REFRESH_SECRET } from '../utils/helpers.js';
import { AuthConstants, Roles } from '../constants.js';
import { validateUserPayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';
// RBAC imports for gating APIs with permission/role guards
// Only /users requires auth here (others public: login/signup/refresh/logout)
import { authenticateToken, authorizePermission } from '../middleware/auth.js';
import { Permissions } from '../constants.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Signup
router.post('/signup', asyncHandler(async (req, res) => {
  validateUserPayload(req.body);
  const { email, password, firstName, lastName, role = 'user', address = '', bio = '' } = req.body;

  // Check existing
  const existing = await usersStore.getUserByEmail(email);
  if (existing) {
    const err = new Error('User already exists');
    err.status = StatusCodes.CONFLICT;
    throw err;
  }

  // Hash
  const hashedPassword = await bcrypt.hash(password, AuthConstants.SALT_ROUNDS);

  const user = await usersStore.createUser({
    email,
    password,
    hashedPassword,
    firstName,
    lastName,
    role,
    address,
    bio,
    initials: `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase(),
  });

  const { accessToken, refreshToken } = createAuthTokens(user);
  setRefreshCookie(res, refreshToken);

  res.status(StatusCodes.CREATED).json({ 
    user: { ...user, password: undefined, hashedPassword: undefined }, 
    accessToken 
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  validateUserPayload(req.body);
  const { email, password } = req.body;

  const user = await usersStore.getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.hashedPassword || user.password))) {
    const err = new Error('Invalid credentials');
    err.status = StatusCodes.UNAUTHORIZED;
    throw err;
  }

  const { accessToken, refreshToken } = createAuthTokens(user);
  setRefreshCookie(res, refreshToken);

  res.json({ 
    user: { ...user, password: undefined, hashedPassword: undefined }, 
    accessToken 
  });
}));

// Refresh token
// Updated for RBAC: lookup user to include role + permissions in new accessToken
// Ensures permission/role guards work post-refresh; maintains stateless security.
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    const err = new Error('Refresh token required');
    err.status = StatusCodes.UNAUTHORIZED;
    throw err;
  }

  const payload = jwt.verify(refreshToken, REFRESH_SECRET);
  // Lookup full user to embed current role/permissions in accessToken
  // (handles role changes; fallback if not found)
  const user = await usersStore.getUserById(payload.id) || { id: payload.id, role: Roles.USER };
  const accessToken = createAccessToken(user);

  res.json({ accessToken });
}));

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// Get all users
// Gated with permission guard: requires 'users:read' (both admin/user have it per RolePermissions)
// Added authenticateToken for security (previously public; exposes sensitive user data)
router.get('/users', authenticateToken, authorizePermission(Permissions.USERS_READ), asyncHandler(async (req, res) => {
  const users = await usersStore.getUsers();
  res.json(users);
}));

export default router;
