import { Router } from 'express';
import * as store from '../data/boards.js';
import { asyncHandler, ensureFound } from '../utils/helpers.js';
import {
  validateBoardPayload,
  validateListPayload,
  validateCardPayload,
  validateRequiredFields,
} from '../utils/validator.js';
import { StatusCodes } from '../constants.js';

const router = Router();

// Static data routes
router.get('/meta/label-colors', asyncHandler(async (req, res) => {
  res.json(await store.getLabelColors());
}));

router.get('/meta/backgrounds', asyncHandler(async (req, res) => {
  res.json(await store.getBoardBackgrounds());
}));

// Reset boards
router.post('/reset', asyncHandler(async (req, res) => {
  await store.resetBoards();
  res.json(await store.getBoards());
}));

// Board routes
router.get('/', asyncHandler(async (req, res) => {
  const includeArchived = req.query.archived === 'true';
  res.json(await store.getBoards(includeArchived));
}));

router.get('/:boardId', asyncHandler(async (req, res) => {
  const includeArchived = req.query.archived === 'true';
  const board = await store.getBoard(req.params.boardId, includeArchived);
  ensureFound(board, 'Board not found');
  res.json(board);
}));

router.post('/', asyncHandler(async (req, res) => {
  validateBoardPayload(req.body);
  const board = await store.createBoard(req.body);
  res.status(StatusCodes.CREATED).json(board);
}));

router.patch('/:boardId', asyncHandler(async (req, res) => {
  validateBoardPayload(req.body);
  const board = await store.updateBoard(req.params.boardId, req.body);
  ensureFound(board, 'Board not found');
  res.json(board);
}));

router.delete('/:boardId', asyncHandler(async (req, res) => {
  const board = await store.removeBoard(req.params.boardId);
  ensureFound(board, 'Board not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

// Board search
router.get('/:boardId/search', asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  const results = await store.searchCards(req.params.boardId, query);
  res.json(results);
}));

// Board labels
router.post('/:boardId/labels', asyncHandler(async (req, res) => {
  validateBoardPayload(req.body); // reuse for label name/color
  const label = await store.addBoardLabel(req.params.boardId, req.body);
  ensureFound(label, 'Board not found');
  res.status(StatusCodes.CREATED).json(label);
}));

router.patch('/:boardId/labels/:labelId', asyncHandler(async (req, res) => {
  validateBoardPayload(req.body); // reuse for label name/color
  const label = await store.updateBoardLabel(req.params.boardId, req.params.labelId, req.body);
  ensureFound(label, 'Label not found');
  res.json(label);
}));

router.delete('/:boardId/labels/:labelId', asyncHandler(async (req, res) => {
  const label = await store.removeBoardLabel(req.params.boardId, req.params.labelId);
  ensureFound(label, 'Label not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

// Archive routes
router.get('/:boardId/archive/cards', asyncHandler(async (req, res) => {
  const cards = await store.getArchivedCards(req.params.boardId);
  ensureFound(cards, 'Board not found');
  res.json(cards);
}));

router.get('/:boardId/archive/lists', asyncHandler(async (req, res) => {
  const lists = await store.getArchivedLists(req.params.boardId);
  ensureFound(lists, 'Board not found');
  res.json(lists);
}));

router.post('/:boardId/archive/cards/:cardId/restore', asyncHandler(async (req, res) => {
  const card = await store.restoreCard(req.params.boardId, req.params.cardId);
  ensureFound(card, 'Card not found');
  res.json(card);
}));

router.post('/:boardId/archive/lists/:listId/restore', asyncHandler(async (req, res) => {
  const list = await store.restoreList(req.params.boardId, req.params.listId);
  ensureFound(list, 'List not found');
  res.json(list);
}));

// List routes
router.post('/:boardId/lists', asyncHandler(async (req, res) => {
  validateListPayload(req.body);
  const list = await store.createList(req.params.boardId, req.body);
  ensureFound(list, 'Board not found');
  res.status(StatusCodes.CREATED).json(list);
}));

router.patch('/:boardId/lists/:listId', asyncHandler(async (req, res) => {
  validateListPayload(req.body);
  const list = await store.updateList(req.params.boardId, req.params.listId, req.body);
  ensureFound(list, 'List not found');
  res.json(list);
}));

router.delete('/:boardId/lists/:listId', asyncHandler(async (req, res) => {
  const list = await store.removeList(req.params.boardId, req.params.listId);
  ensureFound(list, 'List not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

router.post('/:boardId/lists/reorder', asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['listIds'], 'reorder');
  const { listIds } = req.body;
  const lists = await store.reorderLists(req.params.boardId, listIds);
  ensureFound(lists, 'Board not found');
  res.json(lists);
}));

// Card routes
router.post('/:boardId/lists/:listId/cards', asyncHandler(async (req, res) => {
  validateCardPayload(req.body);
  const card = await store.createCard(req.params.boardId, req.params.listId, req.body);
  ensureFound(card, 'List not found');
  res.status(StatusCodes.CREATED).json(card);
}));

router.patch('/:boardId/cards/:cardId', asyncHandler(async (req, res) => {
  validateCardPayload(req.body);
  const card = await store.updateCard(req.params.boardId, req.params.cardId, req.body);
  ensureFound(card, 'Card not found');
  res.json(card);
}));

router.delete('/:boardId/cards/:cardId', asyncHandler(async (req, res) => {
  const card = await store.removeCard(req.params.boardId, req.params.cardId);
  ensureFound(card, 'Card not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

router.post('/:boardId/cards/:cardId/move', asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['targetListId'], 'move');
  const { targetListId, position } = req.body ?? {};
  const card = await store.moveCard(req.params.boardId, req.params.cardId, targetListId, position);
  ensureFound(card, 'Move failed');
  res.json(card);
}));

router.post('/:boardId/lists/:listId/cards/reorder', asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['cardIds'], 'reorder');
  const { cardIds } = req.body;
  const cards = await store.reorderCards(req.params.boardId, req.params.listId, cardIds);
  ensureFound(cards, 'List not found');
  res.json(cards);
}));

// Checklist routes
router.post('/:boardId/cards/:cardId/checklists', asyncHandler(async (req, res) => {
  validateCardPayload(req.body); // reuse for checklist title/items
  const checklist = await store.addChecklist(req.params.boardId, req.params.cardId, req.body);
  ensureFound(checklist, 'Card not found');
  res.status(StatusCodes.CREATED).json(checklist);
}));

router.patch('/:boardId/cards/:cardId/checklists/:checklistId', asyncHandler(async (req, res) => {
  validateCardPayload(req.body); // reuse for checklist title/items
  const checklist = await store.updateChecklist(
    req.params.boardId,
    req.params.cardId,
    req.params.checklistId,
    req.body
  );
  ensureFound(checklist, 'Checklist not found');
  res.json(checklist);
}));

router.delete('/:boardId/cards/:cardId/checklists/:checklistId', asyncHandler(async (req, res) => {
  const checklist = await store.removeChecklist(
    req.params.boardId,
    req.params.cardId,
    req.params.checklistId
  );
  ensureFound(checklist, 'Checklist not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

// Comment routes
router.post('/:boardId/cards/:cardId/comments', asyncHandler(async (req, res) => {
  validateCardPayload(req.body); // reuse for comment text
  const comment = await store.addComment(req.params.boardId, req.params.cardId, req.body);
  ensureFound(comment, 'Card not found');
  res.status(StatusCodes.CREATED).json(comment);
}));

router.patch('/:boardId/cards/:cardId/comments/:commentId', asyncHandler(async (req, res) => {
  validateCardPayload(req.body); // reuse for comment text
  const comment = await store.updateComment(
    req.params.boardId,
    req.params.cardId,
    req.params.commentId,
    req.body
  );
  ensureFound(comment, 'Comment not found');
  res.json(comment);
}));

router.delete('/:boardId/cards/:cardId/comments/:commentId', asyncHandler(async (req, res) => {
  const comment = await store.removeComment(
    req.params.boardId,
    req.params.cardId,
    req.params.commentId
  );
  ensureFound(comment, 'Comment not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

export default router;
