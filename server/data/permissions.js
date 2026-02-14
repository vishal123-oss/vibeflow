/**
 * FS-backed permissions store (per-permission files in data/permissions/ folder).
 * Follows boards.js/users.js pattern for consistency: uses storage.js FS ops.
 * Permissions are the 'DB' entity (no constants/hardcodes elsewhere per req).
 * All possible perms for workspace/board/task/auth RBAC loaded from FS.
 * Supports read (for guards), reset/seed; extend for full mgmt UI later.
 */

import { getRecord, saveRecord, deleteRecord, getAllRecords, listRecords } from '../storage/storage.js';
import { now, generateId as id } from '../utils/helpers.js';

// Load ops (FS 'DB')
async function loadPermission(permId) {
  return getRecord('permissions', permId);
}

async function loadAllPermissions() {
  return getAllRecords('permissions');
}

async function savePermission(perm) {
  return saveRecord('permissions', perm);
}

// Permission operations (FS-based; async to match storage)
export async function getPermissions() {
  // Returns all permissions (for role mapping, UI lists)
  return loadAllPermissions();
}

export async function getPermissionById(permId) {
  // Get single perm by ID (e.g., 'boards:read')
  return loadPermission(permId);
}

// For efficiency: batch load perms by IDs (used in role guards/token)
export async function getPermissionsByIds(permIds = []) {
  if (!permIds.length) return [];
  const perms = [];
  for (const pid of permIds) {
    const p = await loadPermission(pid);
    if (p) perms.push(p.id); // just IDs for guards
  }
  return perms;
}

// Seed helper (internal; called by reset) - defines ALL possible perms (expandable for full RBAC)
async function seedPermissions() {
  const allPerms = [
    // Users/Auth mgmt
    { id: 'users:read', name: 'Read Users', description: 'View user lists (e.g., assignee dropdowns)', category: 'users' },
    { id: 'users:manage', name: 'Manage Users', description: 'Create/update/delete users, assign roles', category: 'users' },

    // Roles/Permissions mgmt (super_admin only for global CRUD)
    { id: 'roles:read', name: 'Read Roles', description: 'View roles', category: 'rbac' },
    { id: 'roles:crud', name: 'CRUD Roles', description: 'Create/update/delete roles (super_admin only)', category: 'rbac' },
    { id: 'permissions:read', name: 'Read Permissions', description: 'View permissions', category: 'rbac' },
    { id: 'permissions:crud', name: 'CRUD Permissions', description: 'Create/update/delete permissions (super_admin only)', category: 'rbac' },

    // Workspaces (global CRUD super_admin only; workspace-scoped for admins)
    { id: 'workspaces:read', name: 'Read Workspaces', description: 'View workspaces/boards', category: 'workspaces' },
    { id: 'workspaces:create', name: 'Create Workspaces', description: 'Create new workspaces (super_admin only)', category: 'workspaces' },
    { id: 'workspaces:update', name: 'Update Workspaces', description: 'Edit workspace details', category: 'workspaces' },
    { id: 'workspaces:delete', name: 'Delete Workspaces', description: 'Delete workspaces (super_admin only)', category: 'workspaces' },
    { id: 'workspaces:reset', name: 'Reset Workspaces', description: 'Admin-only data reset', category: 'workspaces' },
    { id: 'workspaces:manage_members', name: 'Manage Workspace Members', description: 'Add/remove members, roles', category: 'workspaces' },
    { id: 'workspaces:crud_global', name: 'Global Workspaces CRUD', description: 'Super_admin only for top-level workspace ops', category: 'workspaces' },

    // Tasks
    { id: 'tasks:read', name: 'Read Tasks', description: 'View tasks', category: 'tasks' },
    { id: 'tasks:create', name: 'Create Tasks', description: 'Add new tasks', category: 'tasks' },
    { id: 'tasks:update', name: 'Update Tasks', description: 'Edit tasks', category: 'tasks' },
    { id: 'tasks:delete', name: 'Delete Tasks', description: 'Remove tasks', category: 'tasks' },
    { id: 'tasks:reset', name: 'Reset Tasks', description: 'Admin-only reset', category: 'tasks' },
    { id: 'tasks:assign', name: 'Assign Tasks', description: 'Assign to users', category: 'tasks' },

    // Boards (Trello/Jira core + sub-resources; scoped to workspace)
    { id: 'boards:meta_read', name: 'Read Board Meta', description: 'Access label colors/backgrounds', category: 'boards' },
    { id: 'boards:read', name: 'Read Boards', description: 'View boards/lists/cards', category: 'boards' },
    { id: 'boards:create', name: 'Create Boards', description: 'Create new boards', category: 'boards' },
    { id: 'boards:update', name: 'Update Boards', description: 'Edit boards', category: 'boards' },
    { id: 'boards:delete', name: 'Delete Boards', description: 'Remove boards', category: 'boards' },
    { id: 'boards:reset', name: 'Reset Boards', description: 'Admin-only reset', category: 'boards' },
    { id: 'boards:search', name: 'Search Boards', description: 'Search cards', category: 'boards' },
    { id: 'boards:manage_labels', name: 'Manage Board Labels', description: 'CRUD labels', category: 'boards' },
    { id: 'boards:manage_archive', name: 'Manage Archive', description: 'Archive/restore', category: 'boards' },
    { id: 'boards:manage_lists', name: 'Manage Lists', description: 'CRUD/reorder lists', category: 'boards' },
    { id: 'boards:manage_cards', name: 'Manage Cards', description: 'CRUD/move/reorder cards', category: 'boards' },
    { id: 'boards:manage_checklists', name: 'Manage Checklists', description: 'CRUD checklists', category: 'boards' },
    { id: 'boards:manage_comments', name: 'Manage Comments', description: 'CRUD comments', category: 'boards' },
    { id: 'boards:manage_members', name: 'Manage Board Members', description: 'Add/remove board members', category: 'boards' },
  ];

  for (const p of allPerms) {
    p.createdAt = now();
    await savePermission({ ...p, id: p.id }); // ID as-is for perm key
  }
  return allPerms;
}

// Reset (clears/re-seeds from 'DB' defs; follows boards.js reset pattern)
export async function resetPermissions() {
  const perms = await listRecords('permissions');
  for (const pid of perms) {
    await deleteRecord('permissions', pid);
  }
  return seedPermissions(); // Re-seed all possible perms
}

// For RBAC init (called on app start if needed)
export async function initializePermissions() {
  const existing = await listRecords('permissions');
  if (existing.length === 0) {
    return seedPermissions();
  }
  return loadAllPermissions();
}

// Full CRUD for super_admin mgmt (follows users.js/boards.js; saveRecord from storage)
export async function updatePermission(permId, payload) {
  const perm = await getPermissionById(permId);
  if (!perm) return null;
  const updated = { ...perm, ...payload, updatedAt: now() };
  return savePermission(updated);
}

export async function deletePermission(permId) {
  return deleteRecord('permissions', permId);
}
