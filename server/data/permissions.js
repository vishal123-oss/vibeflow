/**
 * FS-backed permissions store (per-permission files in data/permissions/ folder).
 * Extended for RBAC init: add reset/initialize (follows users.js/boards.js pattern; perms hardcoded in *.json but ops for reset).
 * Get ops only for guards/token ; CRUD for super_admin in routes (using storage).
 * Ensures server init succeeds (roles.js calls these).
 */
import { getRecord, getAllRecords, saveRecord, deleteRecord, listRecords } from '../storage/storage.js';

// Permission operations (FS 'DB' static load)
export async function getPermissions() {
  // All permissions from FS files (for role mapping, UI)
  return getAllRecords('permissions');
}

export async function getPermissionById(permId) {
  // Single perm by ID (e.g., 'boards:read')
  return getRecord('permissions', permId);
}

// Batch for guards/token (perms IDs from roles)
export async function getPermissionsByIds(permIds = []) {
  if (!permIds.length) return [];
  const perms = [];
  for (const pid of permIds) {
    const p = await getRecord('permissions', pid);
    if (p) perms.push(p.id);
  }
  return perms;
}

// CRUD for super_admin (storage direct; no seed)
export async function savePermission(perm) {
  if (!perm.id) perm.id = perm.id || `perm-${Date.now()}`;
  perm.createdAt = perm.createdAt || new Date().toISOString();
  return saveRecord('permissions', perm);
}

export async function updatePermission(permId, payload) {
  const perm = await getPermissionById(permId);
  if (!perm) return null;
  const updated = { ...perm, ...payload, updatedAt: new Date().toISOString() };
  return savePermission(updated);
}

export async function deletePermission(permId) {
  return deleteRecord('permissions', permId);
}

// For RBAC compatibility (called by roles.js initialize/reset; perms are static in data/permissions/*.json files)
// Reset: no-op (don't delete hardcoded perm entities to keep allPermIds intact in seedRoles)
// If full wipe needed, use individual delete via super_admin CRUD
// Init: ensure loaded from FS 'DB'
export async function resetPermissions() {
  // Preserve static perms DB for RBAC; follows simplified design (no repeated seed code)
  console.log('[Permissions] Reset skipped for static hardcoded perms');
  return getPermissions();
}

export async function initializePermissions() {
  // Hardcoded perms in FS 'DB'; if index/files missing (e.g., rm), seed defaults array for RBAC (prod reliable init)
  // Ensures 'permissions:read' etc in token for no 401; follows entity json structure
  const existing = await listRecords('permissions');
  if (existing.length === 0) {
    console.log('[Permissions] Seeding default perms for RBAC');
    const defaultPerms = [
      { id: 'permissions:read', name: 'Read Permissions', description: 'View permissions', category: 'rbac' },
      { id: 'permissions:crud', name: 'CRUD Permissions', description: 'Manage permissions', category: 'rbac' },
      { id: 'roles:read', name: 'Read Roles', description: 'View roles', category: 'rbac' },
      { id: 'roles:crud', name: 'CRUD Roles', description: 'Manage roles', category: 'rbac' },
      // Core app perms (to avoid 401 on APIs; extend as needed)
      { id: 'users:read', name: 'Read Users', description: 'View users', category: 'users' },
      { id: 'boards:read', name: 'Read Boards', description: 'View boards', category: 'boards' },
      { id: 'boards:create', name: 'Create Boards', description: 'Create boards', category: 'boards' },
      // ... (add more from files or full seed; sufficient for guards/UI)
    ];
    for (const p of defaultPerms) {
      p.createdAt = new Date().toISOString();
      await saveRecord('permissions', p);
    }
  }
  return getPermissions();
}
