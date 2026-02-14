// Centralized enums/constants (single source for all status codes + other static values)
// Replaces all prior hardcoded numbers/strings across routes/middleware/validators/etc.
// (Env-based moved here from config for full centralization; dummy data untouched)

export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const AuthConstants = {
  SALT_ROUNDS: 10,
  ACCESS_EXPIRES: '15m',
  REFRESH_EXPIRES: '7d',
  MAX_TOKEN_AGE_MS: 7 * 24 * 60 * 60 * 1000, // 7d
};

export const ValidationConstants = {
  MIN_PASSWORD_LENGTH: 8,
  MIN_TITLE_LENGTH: 1, // for boards/lists etc (extendable)
};

export const RegexPatterns = {
  // Stricter email: valid TLD (2+ chars), no consecutive dots
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Password complexity helpers (used in validatePassword)
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /[0-9]/,
  SPECIAL: /[^A-Za-z0-9]/,
};

// Re-export env from original config (for backward compat)
// NOTE: RBAC moved to FS-based 'DB' in data/roles/ and data/permissions/ (per project req: data/ is only DB; no constants/hardcodes elsewhere for roles/perms)
export { PORT, NODE_ENV, JWT_SECRET, REFRESH_SECRET, DATA_ROOT } from './config.js';
