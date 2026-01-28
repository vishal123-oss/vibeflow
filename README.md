# VibeFlow

Trello-like boards with lists, cards, and a minimalistic glass UI.

## Features

- **Boards, lists, cards**: Full board view with list columns and cards.
- **Card details**: Modal editor with AI agent, worktree status, PR link, editor path, preview URL.
- **Magic Kanban**: Assign AI agents, start worktrees, create PR placeholders.
- **Worktree diff peek**: Inline diff text area in the card modal.
- **Flow Map view**: Visual node editor toggle (n8n-style).
- **Preview mode**: Embedded iframe to view live output.
- **Sound notifications**: Plays on move to any “Done” column.
- **Optimistic delete**: Card deletions update UI immediately and revert on server error.
- **Backend middleware**: `requestLogger` + centralized `errorHandler`.
- **Design tokens**: `theme.css` with CSS variables and glassmorphism styling.

## Setup

```bash
npm run install:all
```

## Run

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API**: [http://localhost:4000](http://localhost:4000)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run client + server concurrently |
| `npm run dev:client` | Vite dev server (port 3000) |
| `npm run dev:server` | Express API (port 4000) |
| `npm run build` | Build client for production |

## Project structure

```
├── client/                 # Vite + React
│   ├── src/
│   │   ├── theme/          # theme.css (design tokens)
│   │   ├── context/        # BoardProvider, useBoards
│   │   ├── pages/          # BoardsPage, BoardPage
│   │   └── components/     # BoardSidebar, ListColumn, CardModal, Layout
│   └── vite.config.js      # Proxy /api -> :4000
├── server/
│   ├── middleware/         # requestLogger, errorHandler
│   ├── routes/             # /api/boards CRUD + lists + cards
│   ├── data/               # In-memory board store
│   └── server.js
└── package.json
```

## API

- `GET /api/boards` — List boards
- `GET /api/boards/:boardId` — Get board (lists + cards)
- `POST /api/boards` — Create board
- `PATCH /api/boards/:boardId` — Update board
- `DELETE /api/boards/:boardId` — Delete board
- `POST /api/boards/:boardId/lists` — Create list
- `PATCH /api/boards/:boardId/lists/:listId` — Update list
- `DELETE /api/boards/:boardId/lists/:listId` — Delete list
- `POST /api/boards/:boardId/lists/:listId/cards` — Create card
- `PATCH /api/boards/:boardId/cards/:cardId` — Update card
- `DELETE /api/boards/:boardId/cards/:cardId` — Delete card
- `POST /api/boards/:boardId/cards/:cardId/move` — Move card

Card shape:

```json
{
  "id": "card-101",
  "content": { "title": "Design tokens", "body": "Finalize glassmorphism palette" },
  "meta": { "assignee": "User1", "labels": ["design"], "priority": "high", "dueDate": "2026-02-01" },
  "history": [{ "action": "created", "timestamp": "2026-01-25T10:02:00.000Z" }]
}
```
# vibeflow
# vibeflow
# vibeflow
