/**
 * FS-backed workspace store.
 * Extended for scoped RBAC: members now [{userId, role: 'workspace_admin'|'collaborator'|'guest'}]
 * SuperAdmin only for global CRUD; workspace_admin for inside actions/users/roles/perms scoped.
 * Follows boards.js for FS ops.
 */

import { getRecord, saveRecord, deleteRecord, listRecords, getAllRecords } from '../storage/storage.js';
import { now, generateId as id } from '../utils/helpers.js';
import * as rolesStore from './roles.js'; // For scoped role validation

export async function getWorkspaces() {
  return getAllRecords('workspaces');
}

export async function getWorkspaceById(id) {
  return getRecord('workspaces', id);
}

export async function createWorkspace(payload) {
  // SuperAdmin only (enforced in guard); sets owner as workspace_admin in members
  const workspace = {
    id: payload.id ?? id('workspace'),
    name: payload.name ?? 'Untitled Workspace',
    description: payload.description ?? '',
    ownerId: payload.ownerId ?? null,
    // Members scoped with roles (for workspace_admin/collaborator/guest access)
    members: payload.members ?? (payload.ownerId ? [{ userId: payload.ownerId, role: 'workspace_admin' }] : []),
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
  // SuperAdmin only (global)
  const removed = await getRecord('workspaces', id);
  if (!removed) return null;
  await deleteRecord('workspaces', id);
  return removed;
}

// Scoped mgmt APIs for workspace_admin (add member, assign role/perm inside workspace only)
export async function addMember(workspaceId, userId, role = 'collaborator') {
  // Workspace_admin only; validates role from data/roles
  return withWorkspace(workspaceId, async (ws) => {
    const validRole = await rolesStore.getRoleById(role);
    if (!validRole || !['workspace_admin', 'collaborator', 'guest'].includes(role)) {
      throw new Error('Invalid scoped role');
    }
    const members = ws.members || [];
    if (!members.find(m => m.userId === userId)) {
      members.push({ userId, role });
    }
    ws.members = members;
    return { userId, role };
  });
}

export async function assignRole(workspaceId, userId, role) {
  // Workspace_admin: assign scoped role/perm to user in workspace
  return withWorkspace(workspaceId, async (ws) => {
    const member = (ws.members || []).find(m => m.userId === userId);
    if (!member) return null;
    const validRole = await rolesStore.getRoleById(role);
    if (validRole) member.role = role;
    return member;
  });
}

export async function getWorkspaceMembers(workspaceId) {
  // Read members with roles
  const ws = await getWorkspaceById(workspaceId);
  return ws ? (ws.members || []) : [];
}

// Helper for scoped mutations (like withBoard)
async function withWorkspace(workspaceId, updater) {
  let ws = await getRecord('workspaces', workspaceId);
  if (!ws) return null;
  const result = await updater(ws);
  await saveRecord('workspaces', ws); // update FS DB
  return result;
}

export async function resetWorkspaces() {
  // SuperAdmin only (clears)
  const workspaces = await listRecords('workspaces');
  for (const wid of workspaces) {
    await deleteRecord('workspaces', wid);
  }
  return [];
}
