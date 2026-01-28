import { Router } from 'express';
import * as store from '../data/tasks.js';

const router = Router();

router.post('/reset', (req, res, next) => {
  try {
    const tasks = store.reset();
    res.json(tasks);
  } catch (e) {
    next(e);
  }
});

router.get('/', (req, res, next) => {
  try {
    const tasks = store.getAll();
    res.json(tasks);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const task = store.getById(req.params.id);
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

router.post('/', (req, res, next) => {
  try {
    const task = store.create(req.body);
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', (req, res, next) => {
  try {
    const task = store.update(req.params.id, req.body);
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

router.delete('/:id', (req, res, next) => {
  try {
    const task = store.remove(req.params.id);
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
