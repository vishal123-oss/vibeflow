import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as usersStore from '../data/users.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vibeflow-demo-secret-key-change-in-prod';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'vibeflow-refresh-secret-change-in-prod';
const SALT_ROUNDS = 10;
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

// Signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role = 'user', address = '', bio = '' } = req.body;
    if (!email || !password) {
      const err = new Error('Email and password required');
      err.status = 400;
      throw err;
    }

    // Check existing
    const existing = await usersStore.getUserByEmail(email);
    if (existing) {
      const err = new Error('User already exists');
      err.status = 409;
      throw err;
    }

    // Hash
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await usersStore.createUser({
      email,
      password, // plain temp
      hashedPassword,
      firstName,
      lastName,
      role,
      address,
      bio,
      initials: `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase(),
    });

    // Tokens
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

    // HttpOnly cookie for refresh (security)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });

    res.status(201).json({ 
      user: { ...user, password: undefined, hashedPassword: undefined }, 
      accessToken 
    });
  } catch (e) {
    next(e);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error('Email and password required');
      err.status = 400;
      throw err;
    }

    const user = await usersStore.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.hashedPassword || user.password))) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    // Tokens
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

    // HttpOnly cookie for refresh
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ 
      user: { ...user, password: undefined, hashedPassword: undefined }, 
      accessToken 
    });
  } catch (e) {
    next(e);
  }
});

// Refresh token
router.post('/refresh', (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      const err = new Error('Refresh token required');
      err.status = 401;
      throw err;
    }

    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    // Re-issue access (demo: could lookup user for role etc)
    const accessToken = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });

    res.json({ accessToken });
  } catch (e) {
    const err = new Error('Invalid refresh token');
    err.status = 403;
    next(err);
  }
});

// Logout (clear cookie)
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// Get all users (backend-driven for dropdowns etc)
router.get('/users', async (req, res, next) => {
  try {
    const users = await usersStore.getUsers();
    res.json(users);
  } catch (e) {
    next(e);
  }
});

export default router;
