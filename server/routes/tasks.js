import { Router } from 'express';
import * as store from '../data/tasks.js';
import { asyncHandler, ensureFound } from '../utils/helpers.js';
import { validateTaskPayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';
// RBAC: permission guard for each tasks API
// Base authenticateToken from server.js; guards enforce role perms (e.g. reset: admin-only)
// Ensures if user lacks permission/role, action blocked for full security.
import { authorizePermission } from '../middleware/auth.js';
import { Permissions } from '../constants.js';

const router = Router();

// Reset - admin-only (users lack TASKS_RESET perm for security/demo data protection)
router.post('/reset', authorizePermission(Permissions.TASKS_RESET), asyncHandler(async (req, res) => {
  const tasks = await store.reset();
  res.json(tasks);
}));

// Read all
router.get('/', authorizePermission(Permissions.TASKS_READ), asyncHandler(async (req, res) => {
  const tasks = await store.getAll();
  res.json(tasks);
}));

// Read by ID
router.get('/:id', authorizePermission(Permissions.TASKS_READ), asyncHandler(async (req, res) => {
  const task = await store.getById(req.params.id);
  ensureFound(task, 'Task not found');
  res.json(task);
}));

// Create
router.post('/', authorizePermission(Permissions.TASKS_CREATE), asyncHandler(async (req, res) => {
  validateTaskPayload(req.body);
  const task = await store.create(req.body);
  res.status(StatusCodes.CREATED).json(task);
}));

// Update
router.patch('/:id', authorizePermission(Permissions.TASKS_UPDATE), asyncHandler(async (req, res) => {
  validateTaskPayload(req.body);
  const task = await store.update(req.params.id, req.body);
  ensureFound(task, 'Task not found');
  res.json(task);
}));

// Delete
router.delete('/:id', authorizePermission(Permissions.TASKS_DELETE), asyncHandler(async (req, res) => {
  const task = await store.remove(req.params.id);
  ensureFound(task, 'Task not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

export default router;
