import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as usersStore from '../data/users.js';
import * as rolesStore from '../data/roles.js';
import * as permStore from '../data/permissions.js';
import { asyncHandler, createAuthTokens, createAccessToken, setRefreshCookie, REFRESH_SECRET, generateId as id } from '../utils/helpers.js';
import { AuthConstants } from '../constants.js';
import { validateUserPayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';
// RBAC: now FS-based (data/roles.js + data/permissions.js); gates use perm ID strings (matching DB keys)
// No constants/enums outside data/ folder; createAccessToken async (awaits DB load) but wrapped in asyncHandler
// /users, /roles, /permissions require auth; rbac CRUD only super_admin
import { authenticateToken, authorizePermission, authorizeSuperAdmin } from '../middleware/auth.js';
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

  // createAuthTokens now async (loads role's perms from data/roles 'DB')
  const { accessToken, refreshToken } = await createAuthTokens(user);
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

  // createAuthTokens now async (loads role's perms from data/roles 'DB')
  const { accessToken, refreshToken } = await createAuthTokens(user);
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
  // Lookup full user to embed current role/permissions in accessToken (from data/roles DB)
  // (handles role changes; fallback to 'user' if not found)
  const user = await usersStore.getUserById(payload.id) || { id: payload.id, role: 'user' };
  // createAccessToken now async (loads perms for role from FS 'DB')
  const accessToken = await createAccessToken(user);

  res.json({ accessToken });
}));

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// Get all users
// Gated with permission guard: requires 'users:read' (both admin/user/member etc have it per data/roles DB)
// Added authenticateToken for security (previously public; exposes sensitive user data)
// Perm string matches DB entity key (no constants outside data/)
router.get('/users', authenticateToken, authorizePermission('users:read'), asyncHandler(async (req, res) => {
  const users = await usersStore.getUsers();
  res.json(users);
}));

// RBAC mgmt APIs (/roles, /permissions) - strict: SuperAdmin only for CRUD (global top-level)
// Follows boards.js structure; read for auth users, write gated by authorizeSuperAdmin
// This enforces: only super_admin can add/change/delete roles/permissions (per req)
router.get('/roles', authenticateToken, authorizePermission('roles:read'), asyncHandler(async (req, res) => {
  const roles = await rolesStore.getRoles();
  res.json(roles);
}));
router.post('/roles', authenticateToken, authorizeSuperAdmin(), asyncHandler(async (req, res) => {
  // SuperAdmin only (global CRUD)
  const role = await rolesStore.saveRole({ ...req.body, id: req.body.id ?? id('role') });
  res.status(StatusCodes.CREATED).json(role);
}));
router.patch('/roles/:roleId', authenticateToken, authorizeSuperAdmin(), asyncHandler(async (req, res) => {
  const role = await rolesStore.updateRole(req.params.roleId, req.body);
  res.json(role);
}));
router.delete('/roles/:roleId', authenticateToken, authorizeSuperAdmin(), asyncHandler(async (req, res) => {
  await rolesStore.deleteRole(req.params.roleId);
  res.status(StatusCodes.NO_CONTENT).send();
}));

// Permissions (similar superAdmin CRUD)
router.get('/permissions', authenticateToken, authorizePermission('permissions:read'), asyncHandler(async (req, res) => {
  const perms = await permStore.getPermissions();
  res.json(perms);
}));
router.post('/permissions', authenticateToken, authorizeSuperAdmin(), asyncHandler(async (req, res) => {
  const perm = await permStore.savePermission({ ...req.body, id: req.body.id ?? id('perm') });
  res.status(StatusCodes.CREATED).json(perm);
}));
router.patch('/permissions/:permId', authenticateToken, authorizeSuperAdmin(), asyncHandler(async (req, res) => {
  const perm = await permStore.updatePermission(req.params.permId, req.body);
  res.json(perm);
}));
router.delete('/permissions/:permId', authenticateToken, authorizeSuperAdmin(), asyncHandler(async (req, res) => {
  await permStore.deletePermission(req.params.permId);
  res.status(StatusCodes.NO_CONTENT).send();
}));

export default router;
