/**
 * FS-backed board store (per-board files in boards/ folder).
 * Uses storage utils for schema compliance.
 */

import { getRecord, saveRecord, deleteRecord, listRecords, getAllRecords, readJson } from '../storage/storage.js';
import path from 'path';

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// Load static dummy from entity storage (no hardcodes in store)
async function loadLabelColors() {
  const { DATA_ROOT } = await import('../storage/storage.js');
  return readJson(path.join(DATA_ROOT, 'labels/colors.json')) || [];
}

async function loadBoardBackgrounds() {
  const { DATA_ROOT } = await import('../storage/storage.js');
  return readJson(path.join(DATA_ROOT, 'boards/backgrounds.json')) || [];
}

// Helper functions (FS-based; load/save full board)
const addActivity = (card, action, user = 'system') => ({
  ...card,
  activity: [...(card.activity || []), { action, user, timestamp: now() }],
});

const findCard = (board, cardId) => {
  for (const list of board.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) return { card, list };
  }
  return { card: null, list: null };
};

async function loadBoard(boardId) {
  return getRecord('boards', boardId);
}

async function saveBoard(board) {
  return saveRecord('boards', board);
}

async function loadAllBoards() {
  return getAllRecords('boards');
}

// Board operations (now FS-backed; async)
export async function getBoards(includeArchived = false) {
  const boards = await loadAllBoards();
  return boards
    .filter((b) => includeArchived || !b.archived)
    .map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      background: b.background,
      starred: b.starred,
      archived: b.archived,
      createdAt: b.createdAt,
      listCount: b.lists.filter((l) => !l.archived).length,
      cardCount: b.lists.reduce((sum, l) => sum + l.cards.filter((c) => !c.archived).length, 0),
    }));
}

export async function getBoard(boardId, includeArchived = false) {
  const board = await loadBoard(boardId);
  if (!board) return null;
  if (!includeArchived) {
    return {
      ...board,
      lists: board.lists
        .filter((l) => !l.archived)
        .map((l) => ({
          ...l,
          cards: l.cards.filter((c) => !c.archived).sort((a, b) => a.position - b.position),
        }))
        .sort((a, b) => a.position - b.position),
    };
  }
  return board;
}

export async function createBoard(payload) {
  const backgrounds = await loadBoardBackgrounds();
  const board = {
    id: payload.id ?? id('board'),
    title: payload.title ?? 'Untitled Board',
    description: payload.description ?? '',
    background: payload.background ?? backgrounds[4],
    starred: payload.starred ?? false,
    archived: false,
    createdAt: now(),
    labels: payload.labels ?? [
      { id: id('label'), name: 'Bug', color: '#eb5a46' },
      { id: id('label'), name: 'Feature', color: '#61bd4f' },
      { id: id('label'), name: 'Enhancement', color: '#0079bf' },
    ],
    members: payload.members ?? [],
    lists: payload.lists ?? [],
  };
  return saveBoard(board);
}

export async function updateBoard(boardId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  if (payload.title !== undefined) board.title = payload.title;
  if (payload.description !== undefined) board.description = payload.description;
  if (payload.background !== undefined) board.background = payload.background;
  if (payload.starred !== undefined) board.starred = payload.starred;
  if (payload.archived !== undefined) board.archived = payload.archived;
  if (payload.labels !== undefined) board.labels = payload.labels;
  if (payload.members !== undefined) board.members = payload.members;
  return saveBoard(board);
}

export async function removeBoard(boardId) {
  const removed = await loadBoard(boardId);
  if (!removed) return null;
  await deleteRecord('boards', boardId);
  return removed;
}

// List operations (async FS)
export async function createList(boardId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const maxPosition = Math.max(-1, ...board.lists.map((l) => l.position));
  const list = {
    id: payload.id ?? id('list'),
    title: payload.title ?? 'Untitled List',
    position: payload.position ?? maxPosition + 1,
    archived: false,
    createdAt: now(),
    cards: [],
  };
  board.lists.push(list);
  await saveBoard(board);
  return list;
}

export async function updateList(boardId, listId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return null;
  if (payload.title !== undefined) list.title = payload.title;
  if (payload.position !== undefined) list.position = payload.position;
  if (payload.archived !== undefined) list.archived = payload.archived;
  await saveBoard(board);
  return list;
}

export async function removeList(boardId, listId) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const idx = board.lists.findIndex((l) => l.id === listId);
  if (idx === -1) return null;
  const [removed] = board.lists.splice(idx, 1);
  await saveBoard(board);
  return removed;
}

export async function reorderLists(boardId, listIds) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  listIds.forEach((listId, index) => {
    const list = board.lists.find((l) => l.id === listId);
    if (list) list.position = index;
  });
  await saveBoard(board);
  return board.lists.sort((a, b) => a.position - b.position);
}

// Card operations (async FS; load/save board after mutate)
export async function createCard(boardId, listId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return null;
  const maxPosition = Math.max(-1, ...list.cards.map((c) => c.position));
  const card = {
    id: payload.id ?? id('card'),
    position: payload.position ?? maxPosition + 1,
    archived: false,
    content: payload.content ?? { title: '', body: '' },
    cover: payload.cover ?? null,
    labels: payload.labels ?? [],
    members: payload.members ?? [],
    dueDate: payload.dueDate ?? null,
    dueComplete: payload.dueComplete ?? false,
    checklists: payload.checklists ?? [],
    comments: payload.comments ?? [],
    attachments: payload.attachments ?? [],
    activity: [{ action: 'created', user: 'user', timestamp: now() }],
  };
  list.cards.push(card);
  await saveBoard(board);
  return card;
}

export async function updateCard(boardId, cardId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;

  // Update card fields
  if (payload.content !== undefined) card.content = { ...card.content, ...payload.content };
  if (payload.cover !== undefined) card.cover = payload.cover;
  if (payload.labels !== undefined) card.labels = payload.labels;
  if (payload.members !== undefined) card.members = payload.members;
  if (payload.dueDate !== undefined) card.dueDate = payload.dueDate;
  if (payload.dueComplete !== undefined) card.dueComplete = payload.dueComplete;
  if (payload.position !== undefined) card.position = payload.position;
  if (payload.archived !== undefined) card.archived = payload.archived;
  if (payload.checklists !== undefined) card.checklists = payload.checklists;
  if (payload.comments !== undefined) card.comments = payload.comments;
  if (payload.attachments !== undefined) card.attachments = payload.attachments;

  // Add activity
  card.activity = [...(card.activity || []), { action: 'updated', user: 'user', timestamp: now() }];

  await saveBoard(board);
  return card;
}

export async function removeCard(boardId, cardId) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  for (const list of board.lists) {
    const idx = list.cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      const [removed] = list.cards.splice(idx, 1);
      await saveBoard(board);
      return removed;
    }
  }
  return null;
}

export async function moveCard(boardId, cardId, targetListId, position) {
  let board = await loadBoard(boardId);
  if (!board) return null;

  // Find and remove card from current list
  let movedCard = null;
  let sourceList = null;
  for (const list of board.lists) {
    const idx = list.cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      [movedCard] = list.cards.splice(idx, 1);
      sourceList = list;
      break;
    }
  }
  if (!movedCard) return null;

  // Find target list
  const targetList = board.lists.find((l) => l.id === targetListId);
  if (!targetList) {
    // Restore card if target not found
    sourceList.cards.push(movedCard);
    await saveBoard(board);
    return null;
  }

  // Update position
  if (position !== undefined && position !== null) {
    movedCard.position = position;
    // Adjust positions of other cards
    targetList.cards.forEach((c) => {
      if (c.position >= position) c.position += 1;
    });
  } else {
    movedCard.position = Math.max(-1, ...targetList.cards.map((c) => c.position)) + 1;
  }

  // Add activity
  movedCard.activity = [
    ...(movedCard.activity || []),
    { action: `moved to ${targetList.title}`, user: 'user', timestamp: now() },
  ];

  targetList.cards.push(movedCard);
  targetList.cards.sort((a, b) => a.position - b.position);

  await saveBoard(board);
  return movedCard;
}

export async function reorderCards(boardId, listId, cardIds) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return null;
  cardIds.forEach((cardId, index) => {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) card.position = index;
  });
  list.cards.sort((a, b) => a.position - b.position);
  await saveBoard(board);
  return list.cards;
}

// Checklist operations (async FS)
export async function addChecklist(boardId, cardId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;

  const checklist = {
    id: payload.id ?? id('checklist'),
    title: payload.title ?? 'Checklist',
    items: payload.items ?? [],
  };
  card.checklists.push(checklist);
  card.activity.push({ action: 'added checklist', user: 'user', timestamp: now() });
  await saveBoard(board);
  return checklist;
}

export async function updateChecklist(boardId, cardId, checklistId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  const checklist = card.checklists.find((c) => c.id === checklistId);
  if (!checklist) return null;

  if (payload.title !== undefined) checklist.title = payload.title;
  if (payload.items !== undefined) checklist.items = payload.items;
  await saveBoard(board);
  return checklist;
}

export async function removeChecklist(boardId, cardId, checklistId) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  const idx = card.checklists.findIndex((c) => c.id === checklistId);
  if (idx === -1) return null;
  const [removed] = card.checklists.splice(idx, 1);
  card.activity.push({ action: 'removed checklist', user: 'user', timestamp: now() });
  await saveBoard(board);
  return removed;
}

// Comment operations (async FS)
export async function addComment(boardId, cardId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;

  const comment = {
    id: payload.id ?? id('comment'),
    author: payload.author ?? 'user',
    text: payload.text ?? '',
    createdAt: now(),
  };
  card.comments.push(comment);
  card.activity.push({ action: 'added comment', user: payload.author, timestamp: now() });
  await saveBoard(board);
  return comment;
}

export async function updateComment(boardId, cardId, commentId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  const comment = card.comments.find((c) => c.id === commentId);
  if (!comment) return null;

  if (payload.text !== undefined) comment.text = payload.text;
  await saveBoard(board);
  return comment;
}

export async function removeComment(boardId, cardId, commentId) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  const idx = card.comments.findIndex((c) => c.id === commentId);
  if (idx === -1) return null;
  const [removed] = card.comments.splice(idx, 1);
  await saveBoard(board);
  return removed;
}

// Label operations (async FS)
export async function addBoardLabel(boardId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const label = {
    id: payload.id ?? id('label'),
    name: payload.name ?? '',
    color: payload.color ?? '#0079bf',
  };
  board.labels.push(label);
  await saveBoard(board);
  return label;
}

export async function updateBoardLabel(boardId, labelId, payload) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const label = board.labels.find((l) => l.id === labelId);
  if (!label) return null;
  if (payload.name !== undefined) label.name = payload.name;
  if (payload.color !== undefined) label.color = payload.color;
  await saveBoard(board);
  return label;
}

export async function removeBoardLabel(boardId, labelId) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const idx = board.labels.findIndex((l) => l.id === labelId);
  if (idx === -1) return null;
  const [removed] = board.labels.splice(idx, 1);
  // Remove label from all cards
  board.lists.forEach((list) => {
    list.cards.forEach((card) => {
      card.labels = card.labels.filter((l) => l !== labelId);
    });
  });
  await saveBoard(board);
  return removed;
}

// Archive operations (async FS)
export async function getArchivedCards(boardId) {
  const board = await loadBoard(boardId);
  if (!board) return null;
  const archived = [];
  board.lists.forEach((list) => {
    list.cards.filter((c) => c.archived).forEach((card) => {
      archived.push({ ...card, listId: list.id, listTitle: list.title });
    });
  });
  return archived;
}

export async function getArchivedLists(boardId) {
  const board = await loadBoard(boardId);
  if (!board) return null;
  return board.lists.filter((l) => l.archived);
}

export async function restoreCard(boardId, cardId) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  card.archived = false;
  card.activity.push({ action: 'restored from archive', user: 'user', timestamp: now() });
  await saveBoard(board);
  return card;
}

export async function restoreList(boardId, listId) {
  let board = await loadBoard(boardId);
  if (!board) return null;
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return null;
  list.archived = false;
  await saveBoard(board);
  return list;
}

// Search (async FS)
export async function searchCards(boardId, query) {
  const board = await loadBoard(boardId);
  if (!board) return [];
  const q = query.toLowerCase();
  const results = [];
  board.lists.forEach((list) => {
    if (list.archived) return;
    list.cards.forEach((card) => {
      if (card.archived) return;
      const titleMatch = card.content.title?.toLowerCase().includes(q);
      const bodyMatch = card.content.body?.toLowerCase().includes(q);
      if (titleMatch || bodyMatch) {
        results.push({ ...card, listId: list.id, listTitle: list.title });
      }
    });
  });
  return results;
}

// Static data (load from entity storage files)
export async function getLabelColors() {
  return loadLabelColors();
}

export async function getBoardBackgrounds() {
  return loadBoardBackgrounds();
}

// Reset (FS re-init; dummy boards in entity files)
export async function resetBoards() {
  const boards = await listRecords('boards');
  for (const bid of boards) {
    await deleteRecord('boards', bid);
  }
  return [];
}
