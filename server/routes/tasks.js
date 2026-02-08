import { Router } from 'express';
import * as store from '../data/tasks.js';

const router = Router();

router.post('/reset', async (req, res, next) => {
  try {
    const tasks = await store.reset(); // Note: reset now sync but loads FS
    res.json(tasks);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const tasks = await store.getAll();
    res.json(tasks);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const task = await store.getById(req.params.id); // Make getById async if needed
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }
    res.json(task);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const task = await store.create(req.body); // Assume updated
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const task = await store.update(req.params.id, req.body);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }
    res.json(task);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const task = await store.remove(req.params.id);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
