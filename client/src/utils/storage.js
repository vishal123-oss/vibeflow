/**
 * Utils for storage (localStorage wrapper; prod: safe get/set/remove, error handling).
 * Replaces direct localStorage calls (AuthContext, workspaces).
 * Relevant only for persistence.
 */
const STORAGE_PREFIX = 'vibeflow_';

export const setStorage = (key, value) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Storage set failed:', e); // Prod: silent or log service
  }
};

export const getStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Storage get failed:', e);
    return defaultValue;
  }
};

export const removeStorage = (key) => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (e) {
    console.error('Storage remove failed:', e);
  }
};