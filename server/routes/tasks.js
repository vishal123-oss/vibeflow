import { Router } from 'express';
import * as store from '../data/tasks.js';
import { asyncHandler, ensureFound } from '../utils/helpers.js';
import { validateTaskPayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';
// RBAC: permission guard for each tasks API
// Base authenticateToken from server.js; guards enforce role perms from data/roles DB (e.g. reset: admin-only)
// No constants outside data/ folder; perm strings match keys in data/permissions/*.json
// Ensures if user lacks permission/role, action blocked for full security.
import { authorizePermission } from '../middleware/auth.js';

const router = Router();

// Reset - admin-only (users lack 'tasks:reset' perm from data/roles DB for security/demo data protection)
router.post('/reset', authorizePermission('tasks:reset'), asyncHandler(async (req, res) => {
  const tasks = await store.reset();
  res.json(tasks);
}));

// Read all
router.get('/', authorizePermission('tasks:read'), asyncHandler(async (req, res) => {
  const tasks = await store.getAll();
  res.json(tasks);
}));

// Read by ID
router.get('/:id', authorizePermission('tasks:read'), asyncHandler(async (req, res) => {
  const task = await store.getById(req.params.id);
  ensureFound(task, 'Task not found');
  res.json(task);
}));

// Create
router.post('/', authorizePermission('tasks:create'), asyncHandler(async (req, res) => {
  validateTaskPayload(req.body);
  const task = await store.create(req.body);
  res.status(StatusCodes.CREATED).json(task);
}));

// Update
router.patch('/:id', authorizePermission('tasks:update'), asyncHandler(async (req, res) => {
  validateTaskPayload(req.body);
  const task = await store.update(req.params.id, req.body);
  ensureFound(task, 'Task not found');
  res.json(task);
}));

// Delete
router.delete('/:id', authorizePermission('tasks:delete'), asyncHandler(async (req, res) => {
  const task = await store.remove(req.params.id);
  ensureFound(task, 'Task not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

export default router;
