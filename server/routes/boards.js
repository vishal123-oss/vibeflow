import { Router } from 'express';
import * as store from '../data/boards.js';

const router = Router();

// Static data routes
router.get('/meta/label-colors', async (req, res, next) => {
  try {
    res.json(await store.getLabelColors());
  } catch (e) {
    next(e);
  }
});

router.get('/meta/backgrounds', async (req, res, next) => {
  try {
    res.json(await store.getBoardBackgrounds());
  } catch (e) {
    next(e);
  }
});

// Reset boards (demo data)
router.post('/reset', async (req, res, next) => {
  try {
    await store.resetBoards();
    res.json(await store.getBoards());
  } catch (e) {
    next(e);
  }
});

// Board routes
router.get('/', async (req, res, next) => {
  try {
    const includeArchived = req.query.archived === 'true';
    res.json(await store.getBoards(includeArchived));
  } catch (e) {
    next(e);
  }
});

router.get('/:boardId', async (req, res, next) => {
  try {
    const includeArchived = req.query.archived === 'true';
    const board = await store.getBoard(req.params.boardId, includeArchived);
    if (!board) {
      const err = new Error('Board not found');
      err.status = 404;
      throw err;
    }
    res.json(board);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const board = await store.createBoard(req.body);
    res.status(201).json(board);
  } catch (e) {
    next(e);
  }
});

router.patch('/:boardId', async (req, res, next) => {
  try {
    const board = await store.updateBoard(req.params.boardId, req.body);
    if (!board) {
      const err = new Error('Board not found');
      err.status = 404;
      throw err;
    }
    res.json(board);
  } catch (e) {
    next(e);
  }
});

router.delete('/:boardId', async (req, res, next) => {
  try {
    const board = await store.removeBoard(req.params.boardId);
    if (!board) {
      const err = new Error('Board not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Board search
router.get('/:boardId/search', async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const results = await store.searchCards(req.params.boardId, query);
    res.json(results);
  } catch (e) {
    next(e);
  }
});

// Board labels
router.post('/:boardId/labels', async (req, res, next) => {
  try {
    const label = await store.addBoardLabel(req.params.boardId, req.body);
    if (!label) {
      const err = new Error('Board not found');
      err.status = 404;
      throw err;
    }
    res.status(201).json(label);
  } catch (e) {
    next(e);
  }
});

router.patch('/:boardId/labels/:labelId', async (req, res, next) => {
  try {
    const label = await store.updateBoardLabel(req.params.boardId, req.params.labelId, req.body);
    if (!label) {
      const err = new Error('Label not found');
      err.status = 404;
      throw err;
    }
    res.json(label);
  } catch (e) {
    next(e);
  }
});

router.delete('/:boardId/labels/:labelId', async (req, res, next) => {
  try {
    const label = await store.removeBoardLabel(req.params.boardId, req.params.labelId);
    if (!label) {
      const err = new Error('Label not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Archive routes
router.get('/:boardId/archive/cards', async (req, res, next) => {
  try {
    const cards = await store.getArchivedCards(req.params.boardId);
    if (!cards) {
      const err = new Error('Board not found');
      err.status = 404;
      throw err;
    }
    res.json(cards);
  } catch (e) {
    next(e);
  }
});

router.get('/:boardId/archive/lists', async (req, res, next) => {
  try {
    const lists = await store.getArchivedLists(req.params.boardId);
    if (!lists) {
      const err = new Error('Board not found');
      err.status = 404;
      throw err;
    }
    res.json(lists);
  } catch (e) {
    next(e);
  }
});

router.post('/:boardId/archive/cards/:cardId/restore', async (req, res, next) => {
  try {
    const card = await store.restoreCard(req.params.boardId, req.params.cardId);
    if (!card) {
      const err = new Error('Card not found');
      err.status = 404;
      throw err;
    }
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.post('/:boardId/archive/lists/:listId/restore', async (req, res, next) => {
  try {
    const list = await store.restoreList(req.params.boardId, req.params.listId);
    if (!list) {
      const err = new Error('List not found');
      err.status = 404;
      throw err;
    }
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// List routes
router.post('/:boardId/lists', async (req, res, next) => {
  try {
    const list = await store.createList(req.params.boardId, req.body);
    if (!list) {
      const err = new Error('Board not found');
      err.status = 404;
      throw err;
    }
    res.status(201).json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/:boardId/lists/:listId', async (req, res, next) => {
  try {
    const list = await store.updateList(req.params.boardId, req.params.listId, req.body);
    if (!list) {
      const err = new Error('List not found');
      err.status = 404;
      throw err;
    }
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.delete('/:boardId/lists/:listId', async (req, res, next) => {
  try {
    const list = await store.removeList(req.params.boardId, req.params.listId);
    if (!list) {
      const err = new Error('List not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.post('/:boardId/lists/reorder', async (req, res, next) => {
  try {
    const { listIds } = req.body;
    const lists = await store.reorderLists(req.params.boardId, listIds);
    if (!lists) {
      const err = new Error('Board not found');
      err.status = 404;
      throw err;
    }
    res.json(lists);
  } catch (e) {
    next(e);
  }
});

// Card routes
router.post('/:boardId/lists/:listId/cards', async (req, res, next) => {
  try {
    const card = await store.createCard(req.params.boardId, req.params.listId, req.body);
    if (!card) {
      const err = new Error('List not found');
      err.status = 404;
      throw err;
    }
    res.status(201).json(card);
  } catch (e) {
    next(e);
  }
});

router.patch('/:boardId/cards/:cardId', async (req, res, next) => {
  try {
    const card = await store.updateCard(req.params.boardId, req.params.cardId, req.body);
    if (!card) {
      const err = new Error('Card not found');
      err.status = 404;
      throw err;
    }
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.delete('/:boardId/cards/:cardId', async (req, res, next) => {
  try {
    const card = await store.removeCard(req.params.boardId, req.params.cardId);
    if (!card) {
      const err = new Error('Card not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.post('/:boardId/cards/:cardId/move', async (req, res, next) => {
  try {
    const { targetListId, position } = req.body ?? {};
    const card = await store.moveCard(req.params.boardId, req.params.cardId, targetListId, position);
    if (!card) {
      const err = new Error('Move failed');
      err.status = 404;
      throw err;
    }
    res.json(card);
  } catch (e) {
    next(e);
  }
});

router.post('/:boardId/lists/:listId/cards/reorder', async (req, res, next) => {
  try {
    const { cardIds } = req.body;
    const cards = await store.reorderCards(req.params.boardId, req.params.listId, cardIds);
    if (!cards) {
      const err = new Error('List not found');
      err.status = 404;
      throw err;
    }
    res.json(cards);
  } catch (e) {
    next(e);
  }
});

// Checklist routes
router.post('/:boardId/cards/:cardId/checklists', async (req, res, next) => {
  try {
    const checklist = await store.addChecklist(req.params.boardId, req.params.cardId, req.body);
    if (!checklist) {
      const err = new Error('Card not found');
      err.status = 404;
      throw err;
    }
    res.status(201).json(checklist);
  } catch (e) {
    next(e);
  }
});

router.patch('/:boardId/cards/:cardId/checklists/:checklistId', async (req, res, next) => {
  try {
    const checklist = await store.updateChecklist(
      req.params.boardId,
      req.params.cardId,
      req.params.checklistId,
      req.body
    );
    if (!checklist) {
      const err = new Error('Checklist not found');
      err.status = 404;
      throw err;
    }
    res.json(checklist);
  } catch (e) {
    next(e);
  }
});

router.delete('/:boardId/cards/:cardId/checklists/:checklistId', async (req, res, next) => {
  try {
    const checklist = await store.removeChecklist(
      req.params.boardId,
      req.params.cardId,
      req.params.checklistId
    );
    if (!checklist) {
      const err = new Error('Checklist not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Comment routes
router.post('/:boardId/cards/:cardId/comments', async (req, res, next) => {
  try {
    const comment = await store.addComment(req.params.boardId, req.params.cardId, req.body);
    if (!comment) {
      const err = new Error('Card not found');
      err.status = 404;
      throw err;
    }
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

router.patch('/:boardId/cards/:cardId/comments/:commentId', async (req, res, next) => {
  try {
    const comment = await store.updateComment(
      req.params.boardId,
      req.params.cardId,
      req.params.commentId,
      req.body
    );
    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }
    res.json(comment);
  } catch (e) {
    next(e);
  }
});

router.delete('/:boardId/cards/:cardId/comments/:commentId', async (req, res, next) => {
  try {
    const comment = await store.removeComment(
      req.params.boardId,
      req.params.cardId,
      req.params.commentId
    );
    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      throw err;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
