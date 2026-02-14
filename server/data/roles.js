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

// Load ops (FS 'DB')
async function loadRole(roleId) {
  return getRecord('roles', roleId);
}

async function loadAllRoles() {
  return getAllRecords('roles');
}

async function saveRole(role) {
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

// Seed helper (internal; defines all roles + their perm assignments)
async function seedRoles() {
  const allPerms = await permStore.getPermissions(); // Ensure perms seeded first
  const allPermIds = allPerms.map(p => p.id);

  const roles = [
    {
      id: 'admin',
      name: 'Admin',
      description: 'Full access to all permissions (workspace/board/task mgmt)',
      permissions: allPermIds, // admin gets ALL possible perms
      createdAt: now(),
    },
    {
      id: 'user',
      name: 'User',
      description: 'Standard CRUD access (excludes admin resets/manages for security)',
      permissions: allPermIds.filter(id => !id.includes('reset') && !id.includes('manage:')), // e.g., no reset/manage_*
      // Specific: read/create/update/delete + most board/workspace ops; see perms.js seed
      createdAt: now(),
    },
    // Add more roles for full system (e.g., workspace-specific)
    {
      id: 'member',
      name: 'Member',
      description: 'Limited access (read + collaborate on assigned boards/tasks)',
      permissions: allPermIds.filter(id => id.includes('read') || id.includes('manage_comments') || id.includes('manage_checklists') || id.includes('tasks:assign')),
      createdAt: now(),
    },
    {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access for stakeholders',
      permissions: allPermIds.filter(id => id.includes('read') || id.includes('boards:meta_read') || id.includes('boards:search')),
      createdAt: now(),
    },
  ];

  for (const r of roles) {
    await saveRole(r);
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
export async function initializeRoles() {
  const existing = await listRecords('roles');
  if (existing.length === 0) {
    await permStore.initializePermissions(); // Seed perms first
    return seedRoles();
  }
  return loadAllRoles();
}
