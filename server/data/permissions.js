/**
 * FS-backed permissions store (per-permission files in data/permissions/ folder).
 * Simplified: static load only from FS 'DB' entity files (no seeding/reset/init/repeated code per req).
 * Constants/data hardcoded directly in data/permissions/*.json files (the 'DB').
 * Get ops only for guards/token ; CRUD for super_admin in routes (using storage).
 */
import { getRecord, getAllRecords, saveRecord, deleteRecord } from '../storage/storage.js';

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
