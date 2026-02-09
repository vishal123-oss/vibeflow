import { Router } from 'express';
import * as store from '../data/tasks.js';
import { asyncHandler, ensureFound } from '../utils/helpers.js';
import { validateTaskPayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';

const router = Router();

router.post('/reset', asyncHandler(async (req, res) => {
  const tasks = await store.reset();
  res.json(tasks);
}));

router.get('/', asyncHandler(async (req, res) => {
  const tasks = await store.getAll();
  res.json(tasks);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const task = await store.getById(req.params.id);
  ensureFound(task, 'Task not found');
  res.json(task);
}));

router.post('/', asyncHandler(async (req, res) => {
  validateTaskPayload(req.body);
  const task = await store.create(req.body);
  res.status(StatusCodes.CREATED).json(task);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  validateTaskPayload(req.body);
  const task = await store.update(req.params.id, req.body);
  ensureFound(task, 'Task not found');
  res.json(task);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await store.remove(req.params.id);
  ensureFound(task, 'Task not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

export default router;
