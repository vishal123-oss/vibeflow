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
// RBAC: permission guard added to EVERY API/route for role-based access control
// Base authenticateToken applied at router level in server.js
// Now FS-based: perms/roles from data/permissions.js + data/roles.js (no constants/RolePermissions outside data/ DB folder).
// Each action gated by perm ID string (matches key in data/permissions/*.json, e.g., 'boards:reset' only admin role).
// If insufficient perm/role: 403 via authorizePermission middleware.
// This fulfills the RBAC req; resource-level (e.g., board members/owner) can be layered on top.
// See individual routes for perm ID (sourced from DB).
import { authorizePermission } from '../middleware/auth.js';

const router = Router();

// Static data routes (meta) - gated for read access to shared board config
// Perm ID from data/permissions DB
router.get('/meta/label-colors', authorizePermission('boards:meta_read'), asyncHandler(async (req, res) => {
  res.json(await store.getLabelColors());
}));

router.get('/meta/backgrounds', authorizePermission('boards:meta_read'), asyncHandler(async (req, res) => {
  res.json(await store.getBoardBackgrounds());
}));

// Reset boards - admin-only permission (users lack 'boards:reset' to prevent data wipe; from data/roles DB)
router.post('/reset', authorizePermission('boards:reset'), asyncHandler(async (req, res) => {
  await store.resetBoards();
  res.json(await store.getBoards());
}));

// Board routes - gated by board-specific perms (read/create/update/delete)
// Perm IDs from data/permissions DB; no constants outside data/ folder
router.get('/', authorizePermission('boards:read'), asyncHandler(async (req, res) => {
  const includeArchived = req.query.archived === 'true';
  res.json(await store.getBoards(includeArchived));
}));

router.get('/:boardId', authorizePermission('boards:read'), asyncHandler(async (req, res) => {
  const includeArchived = req.query.archived === 'true';
  const board = await store.getBoard(req.params.boardId, includeArchived);
  ensureFound(board, 'Board not found');
  res.json(board);
}));

router.post('/', authorizePermission('boards:create'), asyncHandler(async (req, res) => {
  validateBoardPayload(req.body);
  const board = await store.createBoard(req.body);
  res.status(StatusCodes.CREATED).json(board);
}));

router.patch('/:boardId', authorizePermission('boards:update'), asyncHandler(async (req, res) => {
  validateBoardPayload(req.body);
  const board = await store.updateBoard(req.params.boardId, req.body);
  ensureFound(board, 'Board not found');
  res.json(board);
}));

router.delete('/:boardId', authorizePermission('boards:delete'), asyncHandler(async (req, res) => {
  const board = await store.removeBoard(req.params.boardId);
  ensureFound(board, 'Board not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

// Board search - specific perm for search functionality (string from data/permissions DB)
router.get('/:boardId/search', authorizePermission('boards:search'), asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  const results = await store.searchCards(req.params.boardId, query);
  res.json(results);
}));

// Board labels - manage perm (create/update/delete labels; ID from DB)
router.post('/:boardId/labels', authorizePermission('boards:manage_labels'), asyncHandler(async (req, res) => {
  validateBoardPayload(req.body); // reuse for label name/color
  const label = await store.addBoardLabel(req.params.boardId, req.body);
  ensureFound(label, 'Board not found');
  res.status(StatusCodes.CREATED).json(label);
}));

router.patch('/:boardId/labels/:labelId', authorizePermission('boards:manage_labels'), asyncHandler(async (req, res) => {
  validateBoardPayload(req.body); // reuse for label name/color
  const label = await store.updateBoardLabel(req.params.boardId, req.params.labelId, req.body);
  ensureFound(label, 'Label not found');
  res.json(label);
}));

router.delete('/:boardId/labels/:labelId', authorizePermission('boards:manage_labels'), asyncHandler(async (req, res) => {
  const label = await store.removeBoardLabel(req.params.boardId, req.params.labelId);
  ensureFound(label, 'Label not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

// Archive routes - use manage_archive perm for view/restore (ID from data/permissions DB)
router.get('/:boardId/archive/cards', authorizePermission('boards:manage_archive'), asyncHandler(async (req, res) => {
  const cards = await store.getArchivedCards(req.params.boardId);
  ensureFound(cards, 'Board not found');
  res.json(cards);
}));

router.get('/:boardId/archive/lists', authorizePermission('boards:manage_archive'), asyncHandler(async (req, res) => {
  const lists = await store.getArchivedLists(req.params.boardId);
  ensureFound(lists, 'Board not found');
  res.json(lists);
}));

router.post('/:boardId/archive/cards/:cardId/restore', authorizePermission('boards:manage_archive'), asyncHandler(async (req, res) => {
  const card = await store.restoreCard(req.params.boardId, req.params.cardId);
  ensureFound(card, 'Card not found');
  res.json(card);
}));

router.post('/:boardId/archive/lists/:listId/restore', authorizePermission('boards:manage_archive'), asyncHandler(async (req, res) => {
  const list = await store.restoreList(req.params.boardId, req.params.listId);
  ensureFound(list, 'List not found');
  res.json(list);
}));

// List routes - gated by manage_lists perm (CRUD + reorder for boards/lists; from data/permissions DB)
router.post('/:boardId/lists', authorizePermission('boards:manage_lists'), asyncHandler(async (req, res) => {
  validateListPayload(req.body);
  const list = await store.createList(req.params.boardId, req.body);
  ensureFound(list, 'Board not found');
  res.status(StatusCodes.CREATED).json(list);
}));

router.patch('/:boardId/lists/:listId', authorizePermission('boards:manage_lists'), asyncHandler(async (req, res) => {
  validateListPayload(req.body);
  const list = await store.updateList(req.params.boardId, req.params.listId, req.body);
  ensureFound(list, 'List not found');
  res.json(list);
}));

router.delete('/:boardId/lists/:listId', authorizePermission('boards:manage_lists'), asyncHandler(async (req, res) => {
  const list = await store.removeList(req.params.boardId, req.params.listId);
  ensureFound(list, 'List not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

router.post('/:boardId/lists/reorder', authorizePermission('boards:manage_lists'), asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['listIds'], 'reorder');
  const { listIds } = req.body;
  const lists = await store.reorderLists(req.params.boardId, listIds);
  ensureFound(lists, 'Board not found');
  res.json(lists);
}));

// Card routes - gated by manage_cards perm (CRUD, move, reorder - core Trello-like actions; ID from data/permissions DB)
router.post('/:boardId/lists/:listId/cards', authorizePermission('boards:manage_cards'), asyncHandler(async (req, res) => {
  validateCardPayload(req.body);
  const card = await store.createCard(req.params.boardId, req.params.listId, req.body);
  ensureFound(card, 'List not found');
  res.status(StatusCodes.CREATED).json(card);
}));

router.patch('/:boardId/cards/:cardId', authorizePermission('boards:manage_cards'), asyncHandler(async (req, res) => {
  validateCardPayload(req.body);
  const card = await store.updateCard(req.params.boardId, req.params.cardId, req.body);
  ensureFound(card, 'Card not found');
  res.json(card);
}));

router.delete('/:boardId/cards/:cardId', authorizePermission('boards:manage_cards'), asyncHandler(async (req, res) => {
  const card = await store.removeCard(req.params.boardId, req.params.cardId);
  ensureFound(card, 'Card not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

router.post('/:boardId/cards/:cardId/move', authorizePermission('boards:manage_cards'), asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['targetListId'], 'move');
  const { targetListId, position } = req.body ?? {};
  const card = await store.moveCard(req.params.boardId, req.params.cardId, targetListId, position);
  ensureFound(card, 'Move failed');
  res.json(card);
}));

router.post('/:boardId/lists/:listId/cards/reorder', authorizePermission('boards:manage_cards'), asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['cardIds'], 'reorder');
  const { cardIds } = req.body;
  const cards = await store.reorderCards(req.params.boardId, req.params.listId, cardIds);
  ensureFound(cards, 'List not found');
  res.json(cards);
}));

// Checklist routes - specific perm for checklist management (ID from data/permissions DB)
router.post('/:boardId/cards/:cardId/checklists', authorizePermission('boards:manage_checklists'), asyncHandler(async (req, res) => {
  validateCardPayload(req.body); // reuse for checklist title/items
  const checklist = await store.addChecklist(req.params.boardId, req.params.cardId, req.body);
  ensureFound(checklist, 'Card not found');
  res.status(StatusCodes.CREATED).json(checklist);
}));

router.patch('/:boardId/cards/:cardId/checklists/:checklistId', authorizePermission('boards:manage_checklists'), asyncHandler(async (req, res) => {
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

router.delete('/:boardId/cards/:cardId/checklists/:checklistId', authorizePermission('boards:manage_checklists'), asyncHandler(async (req, res) => {
  const checklist = await store.removeChecklist(
    req.params.boardId,
    req.params.cardId,
    req.params.checklistId
  );
  ensureFound(checklist, 'Checklist not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

// Comment routes - specific perm for comments (add/edit/delete; ID from data/permissions DB)
router.post('/:boardId/cards/:cardId/comments', authorizePermission('boards:manage_comments'), asyncHandler(async (req, res) => {
  validateCardPayload(req.body); // reuse for comment text
  const comment = await store.addComment(req.params.boardId, req.params.cardId, req.body);
  ensureFound(comment, 'Card not found');
  res.status(StatusCodes.CREATED).json(comment);
}));

router.patch('/:boardId/cards/:cardId/comments/:commentId', authorizePermission('boards:manage_comments'), asyncHandler(async (req, res) => {
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

router.delete('/:boardId/cards/:cardId/comments/:commentId', authorizePermission('boards:manage_comments'), asyncHandler(async (req, res) => {
  const comment = await store.removeComment(
    req.params.boardId,
    req.params.cardId,
    req.params.commentId
  );
  ensureFound(comment, 'Comment not found');
  res.status(StatusCodes.NO_CONTENT).send();
}));

export default router;
