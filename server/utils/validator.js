import { StatusCodes, ValidationConstants, RegexPatterns } from '../constants.js';

// Simple custom request validator (no external deps) - reusable across all API endpoints
// Throws errors using centralized StatusCodes

export function validateRequiredFields(body, requiredFields, resource = 'payload') {
  const missing = requiredFields.filter(field => !body || body[field] === undefined || body[field] === '');
  if (missing.length > 0) {
    const err = new Error(`Missing required ${resource} fields: ${missing.join(', ')}`);
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
}

export function validateEmail(email) {
  // Use centralized regex from constants
  if (!email || !RegexPatterns.EMAIL.test(email)) {
    const err = new Error('Invalid email format (e.g. must end with valid TLD like .com)');
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
}

export function validatePositiveNumber(value, field) {
  if (typeof value !== 'number' || value < 0) {
    const err = new Error(`${field} must be a positive number`);
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
}

// Entity-specific validators (extend as needed for production)
export function validateBoardPayload(payload) {
  validateRequiredFields(payload, ['title'], 'board');
  if (payload.title && typeof payload.title !== 'string') {
    const err = new Error('Board title must be a string');
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
}

export function validateTaskPayload(payload) {
  validateRequiredFields(payload, ['content'], 'task');
  if (payload.content && typeof payload.content !== 'object') {
    const err = new Error('Task content must be an object');
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
}

export function validatePassword(password) {
  // Stronger rules: >=8 chars, uppercase, lowercase, number, special char (regex from constants)
  if (!password || password.length < ValidationConstants.MIN_PASSWORD_LENGTH) {
    const err = new Error(`Password must be at least ${ValidationConstants.MIN_PASSWORD_LENGTH} characters`);
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
  if (!RegexPatterns.UPPERCASE.test(password)) {
    const err = new Error('Password must contain at least one uppercase letter');
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
  if (!RegexPatterns.LOWERCASE.test(password)) {
    const err = new Error('Password must contain at least one lowercase letter');
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
  if (!RegexPatterns.NUMBER.test(password)) {
    const err = new Error('Password must contain at least one number');
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
  if (!RegexPatterns.SPECIAL.test(password)) {
    const err = new Error('Password must contain at least one special character');
    err.status = StatusCodes.BAD_REQUEST;
    throw err;
  }
}

export function validateUserPayload(payload) {
  validateRequiredFields(payload, ['email', 'password'], 'user');
  validateEmail(payload.email);
  validatePassword(payload.password);
}

// Generic for lists/cards/etc (used in boards routes)
export function validateListPayload(payload) {
  validateRequiredFields(payload, ['title'], 'list');
}

export function validateCardPayload(payload) {
  validateRequiredFields(payload, ['content'], 'card');
}
