import { getRecord, saveRecord, deleteRecord, listRecords, getAllRecords } from '../storage/storage.js';
import bcrypt from 'bcryptjs';

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

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
