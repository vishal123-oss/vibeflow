/**
 * In-memory task store with nested schema (content, meta, history).
 * Mimics enterprise tools like Linear.
 * Dummy data in tasks/ entity files.
 */

import { getAllRecords, getRecord, saveRecord, deleteRecord } from '../storage/storage.js';
import { now, generateId } from '../utils/helpers.js';

function addHistory(task, action) {
  const entry = { action, timestamp: now() };
  return {
    ...task,
    history: [...(task.history || []), entry],
  };
}

export async function getAll() {
  // Always read from entity storage files (no hardcoded)
  return getAllRecords('tasks') || [];
}

export async function getById(id) {
  // Read from entity
  return getRecord('tasks', id); // Use storage getRecord (add import if needed)
}

export async function create(payload) {
  const task = {
    id: payload.id ?? generateId('vibe'),
    workspaceId: payload.workspaceId,
    content: payload.content ?? { title: '', body: '' },
    meta: payload.meta ?? { assignee: '', labels: [], priority: 'medium' },
    history: [{ action: 'created', timestamp: now() }],
  };
  return saveRecord('tasks', task); // Save to entity file
}

export async function update(id, payload) {
  let task = await getRecord('tasks', id);
  if (!task) return null;
  const updated = addHistory(
    {
      ...task,
      ...(payload.workspaceId !== undefined && { workspaceId: payload.workspaceId }),
      content: { ...task.content, ...payload.content },
      meta: { ...task.meta, ...payload.meta },
    },
    'updated'
  );
  return saveRecord('tasks', updated); // Update entity file
}

export async function remove(id) {
  const task = await getRecord('tasks', id);
  if (!task) return null;
  await deleteRecord('tasks', id);
  return task;
}

export async function reset() {
  // Reload from tasks/ entity storage (clear handled by caller if needed)
  return getAllRecords('tasks') || [];
}
