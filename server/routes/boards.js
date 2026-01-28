import { Router } from 'express';
import * as store from '../data/boards.js';

const router = Router();

// Static data routes
router.get('/meta/label-colors', (req, res) => {
  res.json(store.getLabelColors());
});

router.get('/meta/backgrounds', (req, res) => {
  res.json(store.getBoardBackgrounds());
});

// Reset boards (demo data)
router.post('/reset', (req, res, next) => {
  try {
    store.resetBoards();
    res.json(store.getBoards());
  } catch (e) {
    next(e);
  }
});

// Board routes
router.get('/', (req, res, next) => {
  try {
    const includeArchived = req.query.archived === 'true';
    res.json(store.getBoards(includeArchived));
  } catch (e) {
    next(e);
  }
});

router.get('/:boardId', (req, res, next) => {
  try {
    const includeArchived = req.query.archived === 'true';
    const board = store.getBoard(req.params.boardId, includeArchived);
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

router.post('/', (req, res, next) => {
  try {
    const board = store.createBoard(req.body);
    res.status(201).json(board);
  } catch (e) {
    next(e);
  }
});

router.patch('/:boardId', (req, res, next) => {
  try {
    const board = store.updateBoard(req.params.boardId, req.body);
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

router.delete('/:boardId', (req, res, next) => {
  try {
    const board = store.removeBoard(req.params.boardId);
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
router.get('/:boardId/search', (req, res, next) => {
  try {
    const query = req.query.q || '';
    const results = store.searchCards(req.params.boardId, query);
    res.json(results);
  } catch (e) {
    next(e);
  }
});

// Board labels
router.post('/:boardId/labels', (req, res, next) => {
  try {
    const label = store.addBoardLabel(req.params.boardId, req.body);
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

router.patch('/:boardId/labels/:labelId', (req, res, next) => {
  try {
    const label = store.updateBoardLabel(req.params.boardId, req.params.labelId, req.body);
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

router.delete('/:boardId/labels/:labelId', (req, res, next) => {
  try {
    const label = store.removeBoardLabel(req.params.boardId, req.params.labelId);
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
router.get('/:boardId/archive/cards', (req, res, next) => {
  try {
    const cards = store.getArchivedCards(req.params.boardId);
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

router.get('/:boardId/archive/lists', (req, res, next) => {
  try {
    const lists = store.getArchivedLists(req.params.boardId);
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

router.post('/:boardId/archive/cards/:cardId/restore', (req, res, next) => {
  try {
    const card = store.restoreCard(req.params.boardId, req.params.cardId);
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

router.post('/:boardId/archive/lists/:listId/restore', (req, res, next) => {
  try {
    const list = store.restoreList(req.params.boardId, req.params.listId);
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
router.post('/:boardId/lists', (req, res, next) => {
  try {
    const list = store.createList(req.params.boardId, req.body);
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

router.patch('/:boardId/lists/:listId', (req, res, next) => {
  try {
    const list = store.updateList(req.params.boardId, req.params.listId, req.body);
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

router.delete('/:boardId/lists/:listId', (req, res, next) => {
  try {
    const list = store.removeList(req.params.boardId, req.params.listId);
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

router.post('/:boardId/lists/reorder', (req, res, next) => {
  try {
    const { listIds } = req.body;
    const lists = store.reorderLists(req.params.boardId, listIds);
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
router.post('/:boardId/lists/:listId/cards', (req, res, next) => {
  try {
    const card = store.createCard(req.params.boardId, req.params.listId, req.body);
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

router.patch('/:boardId/cards/:cardId', (req, res, next) => {
  try {
    const card = store.updateCard(req.params.boardId, req.params.cardId, req.body);
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

router.delete('/:boardId/cards/:cardId', (req, res, next) => {
  try {
    const card = store.removeCard(req.params.boardId, req.params.cardId);
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

router.post('/:boardId/cards/:cardId/move', (req, res, next) => {
  try {
    const { targetListId, position } = req.body ?? {};
    const card = store.moveCard(req.params.boardId, req.params.cardId, targetListId, position);
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

router.post('/:boardId/lists/:listId/cards/reorder', (req, res, next) => {
  try {
    const { cardIds } = req.body;
    const cards = store.reorderCards(req.params.boardId, req.params.listId, cardIds);
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
router.post('/:boardId/cards/:cardId/checklists', (req, res, next) => {
  try {
    const checklist = store.addChecklist(req.params.boardId, req.params.cardId, req.body);
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

router.patch('/:boardId/cards/:cardId/checklists/:checklistId', (req, res, next) => {
  try {
    const checklist = store.updateChecklist(
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

router.delete('/:boardId/cards/:cardId/checklists/:checklistId', (req, res, next) => {
  try {
    const checklist = store.removeChecklist(
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
router.post('/:boardId/cards/:cardId/comments', (req, res, next) => {
  try {
    const comment = store.addComment(req.params.boardId, req.params.cardId, req.body);
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

router.patch('/:boardId/cards/:cardId/comments/:commentId', (req, res, next) => {
  try {
    const comment = store.updateComment(
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

router.delete('/:boardId/cards/:cardId/comments/:commentId', (req, res, next) => {
  try {
    const comment = store.removeComment(
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
