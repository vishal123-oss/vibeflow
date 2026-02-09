import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as usersStore from '../data/users.js';
import { asyncHandler, createAuthTokens, setRefreshCookie, JWT_SECRET, REFRESH_SECRET } from '../utils/helpers.js';
import { AuthConstants } from '../constants.js';
import { validateUserPayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';
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
router.post('/refresh', (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      const err = new Error('Refresh token required');
      err.status = StatusCodes.UNAUTHORIZED;
      throw err;
    }

    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    // Re-issue access (demo: could lookup user for role etc)
    const accessToken = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: AuthConstants.ACCESS_EXPIRES });

    res.json({ accessToken });
  } catch (e) {
    const err = new Error('Invalid refresh token');
    err.status = StatusCodes.FORBIDDEN;
    next(err);
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// Get all users
router.get('/users', asyncHandler(async (req, res) => {
  const users = await usersStore.getUsers();
  res.json(users);
}));

export default router;
