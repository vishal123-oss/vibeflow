/**
 * FS-backed workspace store.
 */

import { getRecord, saveRecord, deleteRecord, listRecords, getAllRecords } from '../storage/storage.js';
import { now, generateId as id } from '../utils/helpers.js';

export async function getWorkspaces() {
  return getAllRecords('workspaces');
}

export async function getWorkspaceById(id) {
  return getRecord('workspaces', id);
}

export async function createWorkspace(payload) {
  const workspace = {
    id: payload.id ?? id('workspace'),
    name: payload.name ?? 'Untitled Workspace',
    description: payload.description ?? '',
    ownerId: payload.ownerId ?? null,
    members: payload.members ?? [], // array of user ids (for multi-user workspaces)
    createdAt: now(),
    updatedAt: now(),
  };
  return saveRecord('workspaces', workspace);
}

export async function updateWorkspace(id, payload) {
  const workspace = await getRecord('workspaces', id);
  if (!workspace) return null;
  const updated = {
    ...workspace,
    ...payload,
    updatedAt: now()
  };
  delete updated.id;
  return saveRecord('workspaces', { ...workspace, ...updated });
}

export async function deleteWorkspace(id) {
  const removed = await getRecord('workspaces', id);
  if (!removed) return null;
  await deleteRecord('workspaces', id);
  return removed;
}

export async function resetWorkspaces() {
  const workspaces = await listRecords('workspaces');
  for (const wid of workspaces) {
    await deleteRecord('workspaces', wid);
  }
  return [];
}
