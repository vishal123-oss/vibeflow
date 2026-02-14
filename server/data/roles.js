/**
 * FS-backed roles store (per-role files in data/roles/ folder).
 * Follows boards.js structure: FS ops via storage.js, load role's perms.
 * Roles + associated perms in data/ 'DB' (no constants elsewhere).
 * Defines what roles can do (admin full, user CRUD); supports RBAC guards.
 * Roles entity: e.g., roles-admin.json {id, name, permissions: [permIds], ...}
 */

import { getRecord, saveRecord, deleteRecord, getAllRecords, listRecords } from '../storage/storage.js';
import { now, generateId as id } from '../utils/helpers.js';
import * as permStore from './permissions.js'; // For resolving perms
import * as usersStore from './users.js'; // For dummy super_admin

// Load ops (FS 'DB')
async function loadRole(roleId) {
  return getRecord('roles', roleId);
}

async function loadAllRoles() {
  return getAllRecords('roles');
}

// Internal save (storage)
async function _saveRole(role) {
  return saveRecord('roles', role);
}

// Role operations (async FS; resolves perms)
export async function getRoles() {
  // All roles (for mgmt UI)
  return loadAllRoles();
}

export async function getRoleById(roleId) {
  // Get role by ID + resolve full perms array (for guards/token)
  const role = await loadRole(roleId);
  if (!role) return null;
  // Load associated perms (IDs -> full for flexibility)
  const perms = await permStore.getPermissionsByIds(role.permissions || []);
  return { ...role, permissions: perms };
}

// Get perms for a role (core for RBAC guards)
export async function getPermissionsForRole(roleId) {
  const role = await getRoleById(roleId);
  return role ? role.permissions : [];
}

// Seed helper (internal; defines ALL possible roles + their perm assignments for 'who can access what')
// - super_admin: top-level, full CRUD on roles/perms/workspaces/users (global strict)
// - workspace_admin: owner of workspace, full inside workspace (scoped), manage users/roles/perms per workspace only
// - collaborator: workspace collab (limited actions)
// - guest: read-only
// - admin/user: legacy backward compat (treat as workspace_admin/user)
// Follows perms in data/permissions DB; scoping enforced in guards/APIs (e.g., check workspace.ownerId or members)
async function seedRoles() {
  const allPerms = await permStore.getPermissions(); // Ensure perms seeded first
  const allPermIds = allPerms.map(p => p.id);

  const roles = [
    // Top-level: SuperAdmin only (full CRUD on roles/perms/workspaces; dummy created in users DB)
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Global full access: CRUD roles, permissions, workspaces, users; only role for rbac mgmt',
      permissions: allPermIds, // ALL possible + rbac/workspace global
      isGlobal: true, // flag for guards
      createdAt: now(),
    },
    // Workspace Admin (owner): scoped to their workspace (full inside, create users/assign scoped roles/perms)
    {
      id: 'workspace_admin',
      name: 'Workspace Admin',
      description: 'Workspace owner: all actions inside their workspace; manage members/roles/perms scoped only (not global CRUD)',
      permissions: allPermIds.filter(id => !id.includes('reset') && !id.includes('crud_global') && !id.includes('permissions:') && !id.includes('roles:crud')), // scoped strict
      // Workspace level enforced via ownerId/members in guards/APIs
      createdAt: now(),
    },
    // Legacy/compat
    {
      id: 'admin',
      name: 'Admin',
      description: 'Full access (legacy; maps to workspace_admin)',
      permissions: allPermIds.filter(id => !id.includes('reset') && !id.includes('crud_global') && !id.includes('permissions:') && !id.includes('roles:crud')),
      createdAt: now(),
    },
    {
      id: 'user',
      name: 'User',
      description: 'Standard CRUD (scoped to workspace as collaborator)',
      permissions: allPermIds.filter(id => id.includes('read') || id.includes('create') || id.includes('update') || id.includes('manage_comments') || id.includes('manage_checklists') || id.includes('tasks:assign')), // no delete/reset
      createdAt: now(),
    },
    // Additional roles as requested
    {
      id: 'collaborator',
      name: 'Collaborator',
      description: 'Workspace collab: read + edit own tasks/comments/checklists (scoped)',
      permissions: allPermIds.filter(id => id.includes('read') || id.includes('manage_comments') || id.includes('manage_checklists') || id.includes('tasks:assign') || id.includes('boards:manage_cards')),
      createdAt: now(),
    },
    {
      id: 'guest',
      name: 'Guest',
      description: 'Read-only (view boards/tasks in workspace)',
      permissions: allPermIds.filter(id => id.includes('read') || id.includes('boards:meta_read') || id.includes('boards:search')),
      createdAt: now(),
    },
  ];

  for (const r of roles) {
    await _saveRole(r);
  }
  return roles;
}

// Reset (clears/re-seeds roles + perms; follows boards.js)
export async function resetRoles() {
  const roles = await listRecords('roles');
  for (const rid of roles) {
    await deleteRecord('roles', rid);
  }
  // Ensure perms first
  await permStore.resetPermissions();
  return seedRoles();
}

// Init (called on app start/setup)
// Seeds perms/roles DB + dummy super_admin user (top-level for global CRUD)
export async function initializeRoles() {
  const existing = await listRecords('roles');
  if (existing.length === 0) {
    await permStore.initializePermissions(); // Seed perms first
    await usersStore.initializeUsers(); // Creates dummy super_admin
    return seedRoles();
  }
  // Ensure dummy super_admin exists
  await usersStore.initializeUsers();
  return loadAllRoles();
}

// Full CRUD for super_admin mgmt (follows users.js; for /api/roles)
export async function saveRole(role) { // for create
  if (!role.id) role.id = id('role');
  role.createdAt = role.createdAt || now();
  return saveRecord('roles', role); // direct storage for consistency
}

export async function updateRole(roleId, payload) {
  const role = await getRoleById(roleId);
  if (!role) return null;
  const updated = { ...role, ...payload, updatedAt: now() };
  return _saveRole(updated);
}

export async function deleteRole(roleId) {
  return deleteRecord('roles', roleId);
}
