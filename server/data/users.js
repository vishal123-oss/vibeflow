import { getRecord, saveRecord, deleteRecord, listRecords, getAllRecords } from '../storage/storage.js';
import bcrypt from 'bcryptjs';
import { now, generateId as id } from '../utils/helpers.js';

export async function getUsers(includeInactive = false) {
  const users = await getAllRecords('users');
  return users.filter(u => includeInactive || !u.inactive);
}

export async function getUserById(id) {
  return getRecord('users', id);
}

export async function getUserByEmail(email) {
  const users = await getAllRecords('users');
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(payload) {
  let hashed = payload.hashedPassword;
  if (payload.password && !hashed) {
    hashed = await bcrypt.hash(payload.password, 10);
  }
  const user = {
    id: payload.id ?? id('user'),
    email: payload.email ?? '',
    hashedPassword: hashed ?? '$2b$10$placeholderhash',
    password: payload.password ?? '', // temp, not stored
    firstName: payload.firstName ?? '',
    lastName: payload.lastName ?? '',
    avatar: payload.avatar ?? null,
    initials: payload.initials ?? '',
    role: payload.role ?? 'user',
    address: payload.address ?? '',
    bio: payload.bio ?? '',
    workspaces: payload.workspaces ?? [],
    createdAt: now(),
    updatedAt: now(),
    inactive: false
  };
  return saveRecord('users', user);
}

export async function updateUser(id, payload) {
  const user = await getRecord('users', id);
  if (!user) return null;
  const updated = {
    ...user,
    ...payload,
    updatedAt: now()
  };
  return saveRecord('users', updated);
}

export async function deleteUser(id) {
  return deleteRecord('users', id);
}

export async function resetUsers() {
  // Clear (dummy users in entity files)
  const users = await listRecords('users');
  for (const uid of users) {
    await deleteRecord('users', uid);
  }
  return [];
}

// Seed dummy super_admin (top-level, full access for roles/perms/workspace CRUD)
// As per req: first dummy in DB; password: superpass123 (hashed); email: superadmin@vibeflow.com
export async function seedSuperAdmin() {
  const existing = await getUserByEmail('superadmin@vibeflow.com');
  if (existing) return existing;

  // Hash for super_admin (bcrypt like auth.js) or placeholder to avoid dynamic import issue
  // Password: superpass123 (for login); uses createUser hashing
  const superAdmin = {
    id: 'super-admin',
    email: 'superadmin@vibeflow.com',
    password: 'SuperAdmin@123', // triggers hash in createUser
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin', // global strict for rbac/workspace CRUD
    initials: 'SA',
    bio: 'Top-level SuperAdmin: manages roles, permissions, workspaces globally',
    createdAt: now(),
  };
  return createUser(superAdmin);
}

// Init for users (ensures dummy super_admin; called from RBAC init)
export async function initializeUsers() {
  const users = await listRecords('users');
  if (users.length === 0 || !(await getUserByEmail('superadmin@vibeflow.com'))) {
    await seedSuperAdmin();
  }
  return getUsers();
}
