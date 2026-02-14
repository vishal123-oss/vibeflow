import { Router } from 'express';
import * as store from '../data/workspaces.js';
import { asyncHandler, ensureFound } from '../utils/helpers.js';
import { validateWorkspacePayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';
// RBAC for permission guards on all workspace APIs
// Leverages base authenticateToken (from server.js) + granular permission middleware
// Now FS-based: perms/roles from data/permissions.js + data/roles.js (no constants/RolePermissions)
// Guards use perm ID strings matching DB keys (e.g., 'workspaces:reset' only for admin role)
// Strict: super_admin for global CRUD; workspace_admin for scoped (inside workspace, members/roles)
import { authorizePermission, authorizeSuperAdmin, authorizeWorkspaceAccess } from '../middleware/auth.js';

const router = Router();

// Reusable handler helpers for structure/readability (reuses existing asyncHandler/ensureFound/validate)
const sendOk = (res, data) => res.status(StatusCodes.OK).json(data);
const sendCreated = (res, data) => res.status(StatusCodes.CREATED).json(data);
const sendNoContent = (res) => res.status(StatusCodes.NO_CONTENT).send();

const getAllWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await store.getWorkspaces();
  sendOk(res, workspaces);
});

const getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await store.getWorkspaceById(req.params.workspaceId);
  ensureFound(workspace, 'Workspace not found');
  sendOk(res, workspace);
});

const createWorkspace = asyncHandler(async (req, res) => {
  validateWorkspacePayload(req.body);
  const payload = { ...req.body, ownerId: req.user?.id };
  const workspace = await store.createWorkspace(payload);
  sendCreated(res, workspace);
});

const updateWorkspace = asyncHandler(async (req, res) => {
  validateWorkspacePayload(req.body);
  const workspace = await store.updateWorkspace(req.params.workspaceId, req.body);
  ensureFound(workspace, 'Workspace not found');
  sendOk(res, workspace);
});

const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspace = await store.deleteWorkspace(req.params.workspaceId);
  ensureFound(workspace, 'Workspace not found');
  sendNoContent(res);
});

const resetWorkspaces = asyncHandler(async (req, res) => {
  await store.resetWorkspaces();
  const workspaces = await store.getWorkspaces();
  sendOk(res, workspaces);
});

// Routes - each gated with strict RBAC (super_admin for global CRUD on workspaces; workspace_admin for scoped)
// This implements 'who can access what': super_admin global (workspaces CRUD), ws_admin inside ws (members/roles)
// Perm strings from data/permissions DB; + super/workspace guards; no constants outside data/ folder
// Future: full ownership checks
router.get('/', authorizePermission('workspaces:read'), getAllWorkspaces); // auth users
router.get('/:workspaceId', authorizePermission('workspaces:read'), authorizeWorkspaceAccess(), getWorkspaceById);
router.post('/', authorizeSuperAdmin(), authorizePermission('workspaces:create'), createWorkspace); // super only (global)
router.patch('/:workspaceId', authorizePermission('workspaces:update'), authorizeWorkspaceAccess(), updateWorkspace); // ws_admin scoped
router.delete('/:workspaceId', authorizeSuperAdmin(), authorizePermission('workspaces:delete'), deleteWorkspace); // super only
router.post('/reset', authorizeSuperAdmin(), authorizePermission('workspaces:reset'), resetWorkspaces); // super only

// Scoped APIs for workspace_admin (create/assign users/roles/perms inside ws only; collaborator/guest limited)
// e.g., /members for manage users/roles scoped to ws
router.get('/:workspaceId/members', authorizePermission('workspaces:manage_members'), authorizeWorkspaceAccess(), asyncHandler(async (req, res) => {
  const members = await store.getWorkspaceMembers(req.params.workspaceId);
  sendOk(res, members);
}));
router.post('/:workspaceId/members', authorizePermission('workspaces:manage_members'), authorizeWorkspaceAccess(), asyncHandler(async (req, res) => {
  // ws_admin: add user/member (e.g., create/assign inside ws)
  const { userId, role = 'collaborator' } = req.body;
  const member = await store.addMember(req.params.workspaceId, userId, role);
  sendCreated(res, member);
}));
router.patch('/:workspaceId/members/:userId/role', authorizePermission('workspaces:manage_members'), authorizeWorkspaceAccess(), asyncHandler(async (req, res) => {
  // ws_admin: assign role/perm scoped
  const { role } = req.body;
  const updated = await store.assignRole(req.params.workspaceId, req.params.userId, role);
  sendOk(res, updated);
}));

export default router;
