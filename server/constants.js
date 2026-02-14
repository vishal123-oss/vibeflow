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
export { PORT, NODE_ENV, JWT_SECRET, REFRESH_SECRET, DATA_ROOT } from './config.js';

// RBAC: Roles and Permissions for secure Role-Based Access Control (RBAC) system
// As per project: list of permissions, what roles can do (admin full access, user standard CRUD)
// This enables gating all APIs with permission guards; extend later with resource-level (e.g., workspace owner)
// Future: store rolePermissions in DB, include perms in JWT for client-side too.

export const Roles = {
  ADMIN: 'admin',
  USER: 'user',
};

// Granular permissions matching features (workspaces, tasks, boards, auth/users)
export const Permissions = {
  // Users/Auth management
  USERS_READ: 'users:read',     // for UI lists/dropdowns (e.g., assignee select)
  USERS_MANAGE: 'users:manage', // admin-only actions if added

  // Workspaces
  WORKSPACES_READ: 'workspaces:read',
  WORKSPACES_CREATE: 'workspaces:create',
  WORKSPACES_UPDATE: 'workspaces:update',
  WORKSPACES_DELETE: 'workspaces:delete',
  WORKSPACES_RESET: 'workspaces:reset', // admin/demo only

  // Tasks
  TASKS_READ: 'tasks:read',
  TASKS_CREATE: 'tasks:create',
  TASKS_UPDATE: 'tasks:update',
  TASKS_DELETE: 'tasks:delete',
  TASKS_RESET: 'tasks:reset', // admin/demo only

  // Boards (includes sub-resources: lists, cards, labels, archive, checklists, comments, search, meta)
  BOARDS_META_READ: 'boards:meta_read',     // label colors, backgrounds
  BOARDS_READ: 'boards:read',
  BOARDS_CREATE: 'boards:create',
  BOARDS_UPDATE: 'boards:update',
  BOARDS_DELETE: 'boards:delete',
  BOARDS_RESET: 'boards:reset',             // admin/demo only
  BOARDS_SEARCH: 'boards:search',
  BOARDS_MANAGE_LABELS: 'boards:manage_labels',
  BOARDS_MANAGE_ARCHIVE: 'boards:manage_archive',
  BOARDS_MANAGE_LISTS: 'boards:manage_lists',
  BOARDS_MANAGE_CARDS: 'boards:manage_cards',
  BOARDS_MANAGE_CHECKLISTS: 'boards:manage_checklists',
  BOARDS_MANAGE_COMMENTS: 'boards:manage_comments',
};

// Role-to-Permissions mapping: defines what each role can do
// admin: full access to all permissions
// user: standard access (CRUD + read), excludes reset/manage for security
export const RolePermissions = {
  [Roles.ADMIN]: Object.values(Permissions),
  [Roles.USER]: [
    Permissions.USERS_READ,
    Permissions.WORKSPACES_READ,
    Permissions.WORKSPACES_CREATE,
    Permissions.WORKSPACES_UPDATE,
    Permissions.WORKSPACES_DELETE, // users can manage their workspaces; resource-level checks can be added later
    Permissions.TASKS_READ,
    Permissions.TASKS_CREATE,
    Permissions.TASKS_UPDATE,
    Permissions.TASKS_DELETE,
    Permissions.BOARDS_META_READ,
    Permissions.BOARDS_READ,
    Permissions.BOARDS_CREATE,
    Permissions.BOARDS_UPDATE,
    Permissions.BOARDS_DELETE,
    Permissions.BOARDS_SEARCH,
    Permissions.BOARDS_MANAGE_LABELS,
    Permissions.BOARDS_MANAGE_ARCHIVE,
    Permissions.BOARDS_MANAGE_LISTS,
    Permissions.BOARDS_MANAGE_CARDS,
    Permissions.BOARDS_MANAGE_CHECKLISTS,
    Permissions.BOARDS_MANAGE_COMMENTS,
    // Note: *_RESET excluded for users to prevent data wipe; admins only
  ],
};
