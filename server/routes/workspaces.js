import { Router } from 'express';
import * as store from '../data/workspaces.js';
import { asyncHandler, ensureFound } from '../utils/helpers.js';
import { validateWorkspacePayload } from '../utils/validator.js';
import { StatusCodes } from '../constants.js';

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

// Routes
router.get('/', getAllWorkspaces);
router.get('/:workspaceId', getWorkspaceById);
router.post('/', createWorkspace);
router.patch('/:workspaceId', updateWorkspace);
router.delete('/:workspaceId', deleteWorkspace);
router.post('/reset', resetWorkspaces);

export default router;
