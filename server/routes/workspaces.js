import { Router } from 'express';
import * as store from '../data/workspaces.js';
import { asyncHandler, ensureFound } from '../utils/helpers.js';
import { validateWorkspacePayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';
// RBAC for permission guards on all workspace APIs
// Leverages base authenticateToken (from server.js) + granular permission middleware
// Mapping: see RolePermissions in constants.js (e.g., reset only for admin role)
import { authorizePermission } from '../middleware/auth.js';
import { Permissions } from '../constants.js';

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

// Routes - each gated with permission guard (if no perm/role match in JWT -> 403)
// This implements the RBAC system: unauthorized users cannot perform actions
// e.g., WORKSPACES_RESET only admins have per RolePermissions; others user-accessible
// Future enhancement: add ownership checks (e.g., workspace ownerId == req.user.id)
router.get('/', authorizePermission(Permissions.WORKSPACES_READ), getAllWorkspaces);
router.get('/:workspaceId', authorizePermission(Permissions.WORKSPACES_READ), getWorkspaceById);
router.post('/', authorizePermission(Permissions.WORKSPACES_CREATE), createWorkspace);
router.patch('/:workspaceId', authorizePermission(Permissions.WORKSPACES_UPDATE), updateWorkspace);
router.delete('/:workspaceId', authorizePermission(Permissions.WORKSPACES_DELETE), deleteWorkspace);
router.post('/reset', authorizePermission(Permissions.WORKSPACES_RESET), resetWorkspaces);

export default router;
