/**
 * In-memory task store with nested schema (content, meta, history).
 * Mimics enterprise tools like Linear.
 */

const slug = () => `vibe-${Date.now().toString(36)}`;
const now = () => new Date().toISOString();

const defaultTasks = [
  {
    id: 'vibe-101',
    content: { title: 'Setup API', body: 'Initialize express server with middleware' },
    meta: { assignee: 'User1', labels: ['backend', 'urgent'], priority: 'high', dueDate: '2026-02-01T00:00:00.000Z' },
    history: [{ action: 'created', timestamp: '2026-01-25T10:00:00.000Z' }],
    checklists: [
      { id: 'check-1', title: 'Install dependencies', items: [{ id: 'item-1', text: 'npm install express', completed: true }, { id: 'item-2', text: 'npm install cors', completed: false }] },
    ],
  },
  {
    id: 'vibe-102',
    content: { title: 'Add Theme Engine', body: 'Create theme.css with design tokens' },
    meta: { assignee: 'User2', labels: ['frontend', 'design'], priority: 'medium', dueDate: '2026-01-30T00:00:00.000Z' },
    history: [{ action: 'created', timestamp: '2026-01-25T10:05:00.000Z' }],
    checklists: [],
  },
  {
    id: 'vibe-103',
    content: { title: 'Implement TaskProvider', body: 'Context API with optimistic updates' },
    meta: { assignee: 'User1', labels: ['frontend', 'state'], priority: 'high' },
    history: [{ action: 'created', timestamp: '2026-01-25T10:10:00.000Z' }],
    checklists: [
      { id: 'check-2', title: 'Provider setup', items: [{ id: 'item-3', text: 'Create context', completed: true }, { id: 'item-4', text: 'Add reducer', completed: true }, { id: 'item-5', text: 'Connect components', completed: false }] },
    ],
  },
  {
    id: 'vibe-104',
    content: { title: 'Documentation pass', body: 'Update README and API docs' },
    meta: { assignee: 'User2', labels: ['design'], priority: 'low', dueDate: '2026-02-05T00:00:00.000Z' },
    history: [{ action: 'created', timestamp: '2026-01-25T10:15:00.000Z' }],
    checklists: [],
  },
];

let tasks = JSON.parse(JSON.stringify(defaultTasks));

function addHistory(task, action) {
  const entry = { action, timestamp: now() };
  return {
    ...task,
    history: [...(task.history || []), entry],
  };
}

export function getAll() {
  return [...tasks];
}

export function getById(id) {
  return tasks.find((t) => t.id === id) ?? null;
}

export function create(payload) {
  const task = {
    id: payload.id ?? slug(),
    content: payload.content ?? { title: '', body: '' },
    meta: payload.meta ?? { assignee: '', labels: [], priority: 'medium' },
    history: [{ action: 'created', timestamp: now() }],
  };
  tasks.push(task);
  return task;
}

export function update(id, payload) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const prev = tasks[idx];
  const updated = addHistory(
    {
      ...prev,
      content: { ...prev.content, ...payload.content },
      meta: { ...prev.meta, ...payload.meta },
    },
    'updated'
  );
  tasks[idx] = updated;
  return updated;
}

export function remove(id) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const [removed] = tasks.splice(idx, 1);
  return removed;
}

export function reset() {
  tasks = JSON.parse(JSON.stringify(defaultTasks));
  return tasks;
}
