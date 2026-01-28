/**
 * In-memory board store with full Trello-like schema.
 * Includes: lists, cards, checklists, comments, labels, covers, archive.
 */

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// Predefined label colors
const LABEL_COLORS = [
  { id: 'green', color: '#61bd4f', name: 'Green' },
  { id: 'yellow', color: '#f2d600', name: 'Yellow' },
  { id: 'orange', color: '#ff9f1a', name: 'Orange' },
  { id: 'red', color: '#eb5a46', name: 'Red' },
  { id: 'purple', color: '#c377e0', name: 'Purple' },
  { id: 'blue', color: '#0079bf', name: 'Blue' },
  { id: 'sky', color: '#00c2e0', name: 'Sky' },
  { id: 'lime', color: '#51e898', name: 'Lime' },
  { id: 'pink', color: '#ff78cb', name: 'Pink' },
  { id: 'black', color: '#344563', name: 'Black' },
];

// Board background options
const BOARD_BACKGROUNDS = [
  { id: 'gradient-purple', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient-blue', type: 'gradient', value: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  { id: 'gradient-green', type: 'gradient', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'gradient-orange', type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient-dark', type: 'gradient', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  { id: 'solid-blue', type: 'solid', value: '#0079bf' },
  { id: 'solid-green', type: 'solid', value: '#519839' },
  { id: 'solid-orange', type: 'solid', value: '#d29034' },
  { id: 'solid-red', type: 'solid', value: '#b04632' },
  { id: 'solid-purple', type: 'solid', value: '#89609e' },
];

const defaultBoards = [
  {
    id: 'board-vibe-1',
    title: 'VibeFlow Launch',
    description: 'MVP delivery plan for the Trello-like experience.',
    background: BOARD_BACKGROUNDS[0],
    starred: true,
    archived: false,
    createdAt: '2026-01-25T10:00:00.000Z',
    labels: [
      { id: 'label-1', name: 'Bug', color: '#eb5a46' },
      { id: 'label-2', name: 'Feature', color: '#61bd4f' },
      { id: 'label-3', name: 'Enhancement', color: '#0079bf' },
      { id: 'label-4', name: 'Design', color: '#c377e0' },
      { id: 'label-5', name: 'Urgent', color: '#ff9f1a' },
      { id: 'label-6', name: 'Backend', color: '#344563' },
    ],
    members: [
      { id: 'user-1', name: 'Alice Chen', avatar: null, initials: 'AC' },
      { id: 'user-2', name: 'Bob Smith', avatar: null, initials: 'BS' },
      { id: 'user-3', name: 'Carol Davis', avatar: null, initials: 'CD' },
    ],
    lists: [
      {
        id: 'list-backlog',
        title: 'Backlog',
        position: 0,
        archived: false,
        createdAt: '2026-01-25T10:01:00.000Z',
        cards: [
          {
            id: 'card-001',
            position: 0,
            archived: false,
            content: {
              title: 'User authentication system',
              body: 'Implement OAuth2 with Google and GitHub providers. Include session management and JWT tokens.',
            },
            cover: { type: 'color', value: '#0079bf' },
            labels: ['label-2', 'label-6'],
            members: ['user-1'],
            dueDate: '2026-02-15',
            dueComplete: false,
            checklists: [
              {
                id: 'check-001',
                title: 'Implementation tasks',
                items: [
                  { id: 'item-001', text: 'Set up OAuth providers', completed: true },
                  { id: 'item-002', text: 'Create auth middleware', completed: true },
                  { id: 'item-003', text: 'Build login/signup forms', completed: false },
                  { id: 'item-004', text: 'Add session management', completed: false },
                ],
              },
            ],
            comments: [
              {
                id: 'comment-001',
                author: 'user-2',
                text: 'Should we also support email/password auth?',
                createdAt: '2026-01-25T11:00:00.000Z',
              },
              {
                id: 'comment-002',
                author: 'user-1',
                text: 'Yes, adding that to the scope. Will update the checklist.',
                createdAt: '2026-01-25T11:30:00.000Z',
              },
            ],
            attachments: [],
            activity: [
              { action: 'created', user: 'user-1', timestamp: '2026-01-25T10:02:00.000Z' },
              { action: 'added checklist', user: 'user-1', timestamp: '2026-01-25T10:05:00.000Z' },
            ],
          },
          {
            id: 'card-002',
            position: 1,
            archived: false,
            content: {
              title: 'Database schema design',
              body: 'Design PostgreSQL schema for users, boards, lists, and cards.',
            },
            cover: null,
            labels: ['label-6'],
            members: ['user-2'],
            dueDate: null,
            dueComplete: false,
            checklists: [],
            comments: [],
            attachments: [],
            activity: [{ action: 'created', user: 'user-2', timestamp: '2026-01-25T10:03:00.000Z' }],
          },
        ],
      },
      {
        id: 'list-todo',
        title: 'To Do',
        position: 1,
        archived: false,
        createdAt: '2026-01-25T10:01:00.000Z',
        cards: [
          {
            id: 'card-101',
            position: 0,
            archived: false,
            content: {
              title: 'Design system tokens',
              body: 'Finalize glassmorphism palette, spacing, and typography tokens.',
            },
            cover: { type: 'color', value: '#c377e0' },
            labels: ['label-4', 'label-5'],
            members: ['user-3'],
            dueDate: '2026-02-01',
            dueComplete: false,
            checklists: [
              {
                id: 'check-101',
                title: 'Design tokens',
                items: [
                  { id: 'item-101', text: 'Color palette', completed: true },
                  { id: 'item-102', text: 'Typography scale', completed: true },
                  { id: 'item-103', text: 'Spacing system', completed: false },
                  { id: 'item-104', text: 'Shadow definitions', completed: false },
                  { id: 'item-105', text: 'Border radius tokens', completed: false },
                ],
              },
            ],
            comments: [],
            attachments: [],
            activity: [{ action: 'created', user: 'user-3', timestamp: '2026-01-25T10:02:00.000Z' }],
          },
          {
            id: 'card-102',
            position: 1,
            archived: false,
            content: {
              title: 'API scaffolding',
              body: 'Set up Express endpoints for boards, lists, and cards CRUD operations.',
            },
            cover: null,
            labels: ['label-2', 'label-6'],
            members: ['user-2'],
            dueDate: '2026-02-05',
            dueComplete: false,
            checklists: [],
            comments: [
              {
                id: 'comment-102',
                author: 'user-1',
                text: 'Remember to add proper error handling and validation.',
                createdAt: '2026-01-25T12:00:00.000Z',
              },
            ],
            attachments: [],
            activity: [{ action: 'created', user: 'user-2', timestamp: '2026-01-25T10:03:00.000Z' }],
          },
          {
            id: 'card-103',
            position: 2,
            archived: false,
            content: {
              title: 'Drag and drop implementation',
              body: 'Use @dnd-kit to enable card reordering and moving between lists.',
            },
            cover: { type: 'color', value: '#61bd4f' },
            labels: ['label-2'],
            members: ['user-1'],
            dueDate: '2026-02-10',
            dueComplete: false,
            checklists: [
              {
                id: 'check-103',
                title: 'DnD Features',
                items: [
                  { id: 'item-103a', text: 'Card drag within list', completed: false },
                  { id: 'item-103b', text: 'Card drag between lists', completed: false },
                  { id: 'item-103c', text: 'List reordering', completed: false },
                  { id: 'item-103d', text: 'Touch support', completed: false },
                ],
              },
            ],
            comments: [],
            attachments: [],
            activity: [{ action: 'created', user: 'user-1', timestamp: '2026-01-25T10:04:00.000Z' }],
          },
        ],
      },
      {
        id: 'list-doing',
        title: 'In Progress',
        position: 2,
        archived: false,
        createdAt: '2026-01-25T10:04:00.000Z',
        cards: [
          {
            id: 'card-201',
            position: 0,
            archived: false,
            content: {
              title: 'Board UI components',
              body: 'Build columns, cards, and card detail drawer with glassmorphism styling.',
            },
            cover: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            labels: ['label-2', 'label-4'],
            members: ['user-1', 'user-3'],
            dueDate: '2026-02-03',
            dueComplete: false,
            checklists: [
              {
                id: 'check-201',
                title: 'UI Components',
                items: [
                  { id: 'item-201a', text: 'ListColumn component', completed: true },
                  { id: 'item-201b', text: 'CardItem component', completed: true },
                  { id: 'item-201c', text: 'CardModal component', completed: true },
                  { id: 'item-201d', text: 'AddCardForm', completed: true },
                  { id: 'item-201e', text: 'AddListForm', completed: true },
                  { id: 'item-201f', text: 'Checklist UI', completed: false },
                  { id: 'item-201g', text: 'Comments UI', completed: false },
                ],
              },
            ],
            comments: [
              {
                id: 'comment-201',
                author: 'user-3',
                text: 'The glassmorphism effect looks great! Just need to adjust the blur on mobile.',
                createdAt: '2026-01-25T14:00:00.000Z',
              },
            ],
            attachments: [],
            activity: [
              { action: 'created', user: 'user-1', timestamp: '2026-01-25T10:05:00.000Z' },
              { action: 'moved to In Progress', user: 'user-1', timestamp: '2026-01-25T12:00:00.000Z' },
            ],
          },
        ],
      },
      {
        id: 'list-review',
        title: 'Review',
        position: 3,
        archived: false,
        createdAt: '2026-01-25T10:05:00.000Z',
        cards: [
          {
            id: 'card-301',
            position: 0,
            archived: false,
            content: {
              title: 'Project setup and configuration',
              body: 'Vite + React client, Express server, folder structure, and dev tooling.',
            },
            cover: null,
            labels: ['label-3'],
            members: ['user-2'],
            dueDate: null,
            dueComplete: true,
            checklists: [
              {
                id: 'check-301',
                title: 'Setup tasks',
                items: [
                  { id: 'item-301a', text: 'Initialize Vite project', completed: true },
                  { id: 'item-301b', text: 'Set up Express server', completed: true },
                  { id: 'item-301c', text: 'Configure proxy', completed: true },
                  { id: 'item-301d', text: 'Add ESLint/Prettier', completed: true },
                ],
              },
            ],
            comments: [],
            attachments: [],
            activity: [
              { action: 'created', user: 'user-2', timestamp: '2026-01-25T10:06:00.000Z' },
              { action: 'moved to Review', user: 'user-2', timestamp: '2026-01-25T15:00:00.000Z' },
            ],
          },
        ],
      },
      {
        id: 'list-done',
        title: 'Done',
        position: 4,
        archived: false,
        createdAt: '2026-01-25T10:06:00.000Z',
        cards: [
          {
            id: 'card-401',
            position: 0,
            archived: false,
            content: {
              title: 'Project kickoff meeting',
              body: 'Align team on deliverables, timeline, and responsibilities.',
            },
            cover: { type: 'color', value: '#61bd4f' },
            labels: [],
            members: ['user-1', 'user-2', 'user-3'],
            dueDate: '2026-01-25',
            dueComplete: true,
            checklists: [
              {
                id: 'check-401',
                title: 'Meeting agenda',
                items: [
                  { id: 'item-401a', text: 'Review project scope', completed: true },
                  { id: 'item-401b', text: 'Assign initial tasks', completed: true },
                  { id: 'item-401c', text: 'Set up communication channels', completed: true },
                ],
              },
            ],
            comments: [
              {
                id: 'comment-401',
                author: 'user-1',
                text: 'Great kickoff! Everyone is aligned and ready to go.',
                createdAt: '2026-01-25T17:00:00.000Z',
              },
            ],
            attachments: [],
            activity: [
              { action: 'created', user: 'user-1', timestamp: '2026-01-25T10:07:00.000Z' },
              { action: 'completed', user: 'user-1', timestamp: '2026-01-25T17:00:00.000Z' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'board-personal',
    title: 'Personal Tasks',
    description: 'My personal todo list and goals.',
    background: BOARD_BACKGROUNDS[2],
    starred: false,
    archived: false,
    createdAt: '2026-01-24T08:00:00.000Z',
    labels: [
      { id: 'p-label-1', name: 'Personal', color: '#61bd4f' },
      { id: 'p-label-2', name: 'Work', color: '#0079bf' },
      { id: 'p-label-3', name: 'Health', color: '#ff78cb' },
    ],
    members: [{ id: 'user-1', name: 'Alice Chen', avatar: null, initials: 'AC' }],
    lists: [
      {
        id: 'p-list-todo',
        title: 'To Do',
        position: 0,
        archived: false,
        createdAt: '2026-01-24T08:01:00.000Z',
        cards: [
          {
            id: 'p-card-1',
            position: 0,
            archived: false,
            content: { title: 'Grocery shopping', body: 'Weekly groceries and household items.' },
            cover: null,
            labels: ['p-label-1'],
            members: [],
            dueDate: '2026-01-27',
            dueComplete: false,
            checklists: [
              {
                id: 'p-check-1',
                title: 'Shopping list',
                items: [
                  { id: 'p-item-1', text: 'Milk', completed: false },
                  { id: 'p-item-2', text: 'Bread', completed: false },
                  { id: 'p-item-3', text: 'Eggs', completed: false },
                  { id: 'p-item-4', text: 'Vegetables', completed: false },
                ],
              },
            ],
            comments: [],
            attachments: [],
            activity: [{ action: 'created', user: 'user-1', timestamp: '2026-01-24T08:02:00.000Z' }],
          },
        ],
      },
      {
        id: 'p-list-done',
        title: 'Completed',
        position: 1,
        archived: false,
        createdAt: '2026-01-24T08:02:00.000Z',
        cards: [],
      },
    ],
  },
];

let boards = JSON.parse(JSON.stringify(defaultBoards));

// Helper functions
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

// Board operations
export function getBoards(includeArchived = false) {
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

export function getBoard(boardId, includeArchived = false) {
  const board = boards.find((b) => b.id === boardId);
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

export function createBoard(payload) {
  const board = {
    id: payload.id ?? id('board'),
    title: payload.title ?? 'Untitled Board',
    description: payload.description ?? '',
    background: payload.background ?? BOARD_BACKGROUNDS[4],
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
  boards.push(board);
  return board;
}

export function updateBoard(boardId, payload) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  if (payload.title !== undefined) board.title = payload.title;
  if (payload.description !== undefined) board.description = payload.description;
  if (payload.background !== undefined) board.background = payload.background;
  if (payload.starred !== undefined) board.starred = payload.starred;
  if (payload.archived !== undefined) board.archived = payload.archived;
  if (payload.labels !== undefined) board.labels = payload.labels;
  if (payload.members !== undefined) board.members = payload.members;
  return board;
}

export function removeBoard(boardId) {
  const idx = boards.findIndex((b) => b.id === boardId);
  if (idx === -1) return null;
  const [removed] = boards.splice(idx, 1);
  return removed;
}

// List operations
export function createList(boardId, payload) {
  const board = boards.find((b) => b.id === boardId);
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
  return list;
}

export function updateList(boardId, listId, payload) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return null;
  if (payload.title !== undefined) list.title = payload.title;
  if (payload.position !== undefined) list.position = payload.position;
  if (payload.archived !== undefined) list.archived = payload.archived;
  return list;
}

export function removeList(boardId, listId) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const idx = board.lists.findIndex((l) => l.id === listId);
  if (idx === -1) return null;
  const [removed] = board.lists.splice(idx, 1);
  return removed;
}

export function reorderLists(boardId, listIds) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  listIds.forEach((listId, index) => {
    const list = board.lists.find((l) => l.id === listId);
    if (list) list.position = index;
  });
  return board.lists.sort((a, b) => a.position - b.position);
}

// Card operations
export function createCard(boardId, listId, payload) {
  const board = boards.find((b) => b.id === boardId);
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
  return card;
}

export function updateCard(boardId, cardId, payload) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const { card, list } = findCard(board, cardId);
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

  return card;
}

export function removeCard(boardId, cardId) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  for (const list of board.lists) {
    const idx = list.cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      const [removed] = list.cards.splice(idx, 1);
      return removed;
    }
  }
  return null;
}

export function moveCard(boardId, cardId, targetListId, position) {
  const board = boards.find((b) => b.id === boardId);
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

  return movedCard;
}

export function reorderCards(boardId, listId, cardIds) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return null;
  cardIds.forEach((cardId, index) => {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) card.position = index;
  });
  list.cards.sort((a, b) => a.position - b.position);
  return list.cards;
}

// Checklist operations
export function addChecklist(boardId, cardId, payload) {
  const board = boards.find((b) => b.id === boardId);
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
  return checklist;
}

export function updateChecklist(boardId, cardId, checklistId, payload) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  const checklist = card.checklists.find((c) => c.id === checklistId);
  if (!checklist) return null;

  if (payload.title !== undefined) checklist.title = payload.title;
  if (payload.items !== undefined) checklist.items = payload.items;
  return checklist;
}

export function removeChecklist(boardId, cardId, checklistId) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  const idx = card.checklists.findIndex((c) => c.id === checklistId);
  if (idx === -1) return null;
  const [removed] = card.checklists.splice(idx, 1);
  card.activity.push({ action: 'removed checklist', user: 'user', timestamp: now() });
  return removed;
}

// Comment operations
export function addComment(boardId, cardId, payload) {
  const board = boards.find((b) => b.id === boardId);
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
  return comment;
}

export function updateComment(boardId, cardId, commentId, payload) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  const comment = card.comments.find((c) => c.id === commentId);
  if (!comment) return null;

  if (payload.text !== undefined) comment.text = payload.text;
  return comment;
}

export function removeComment(boardId, cardId, commentId) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  const idx = card.comments.findIndex((c) => c.id === commentId);
  if (idx === -1) return null;
  const [removed] = card.comments.splice(idx, 1);
  return removed;
}

// Label operations
export function addBoardLabel(boardId, payload) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const label = {
    id: payload.id ?? id('label'),
    name: payload.name ?? '',
    color: payload.color ?? '#0079bf',
  };
  board.labels.push(label);
  return label;
}

export function updateBoardLabel(boardId, labelId, payload) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const label = board.labels.find((l) => l.id === labelId);
  if (!label) return null;
  if (payload.name !== undefined) label.name = payload.name;
  if (payload.color !== undefined) label.color = payload.color;
  return label;
}

export function removeBoardLabel(boardId, labelId) {
  const board = boards.find((b) => b.id === boardId);
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
  return removed;
}

// Archive operations
export function getArchivedCards(boardId) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const archived = [];
  board.lists.forEach((list) => {
    list.cards.filter((c) => c.archived).forEach((card) => {
      archived.push({ ...card, listId: list.id, listTitle: list.title });
    });
  });
  return archived;
}

export function getArchivedLists(boardId) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  return board.lists.filter((l) => l.archived);
}

export function restoreCard(boardId, cardId) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const { card } = findCard(board, cardId);
  if (!card) return null;
  card.archived = false;
  card.activity.push({ action: 'restored from archive', user: 'user', timestamp: now() });
  return card;
}

export function restoreList(boardId, listId) {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return null;
  list.archived = false;
  return list;
}

// Search
export function searchCards(boardId, query) {
  const board = boards.find((b) => b.id === boardId);
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

// Static data
export function getLabelColors() {
  return LABEL_COLORS;
}

export function getBoardBackgrounds() {
  return BOARD_BACKGROUNDS;
}

// Reset
export function resetBoards() {
  boards = JSON.parse(JSON.stringify(defaultBoards));
  return boards;
}
