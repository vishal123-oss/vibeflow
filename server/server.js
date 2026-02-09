import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';
import tasksRouter from './routes/tasks.js';
import boardsRouter from './routes/boards.js';
import workspacesRouter from './routes/workspaces.js';
import authRouter from './routes/auth.js';
import { PORT } from './config.js';
import { StatusCodes } from './constants.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Protected routes (require valid JWT)
app.use('/api/tasks', authenticateToken, tasksRouter);
app.use('/api/boards', authenticateToken, boardsRouter);
app.use('/api/workspaces', authenticateToken, workspacesRouter);
// Auth routes are public
app.use('/api/auth', authRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = StatusCodes.NOT_FOUND;
  next(err);
});
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString().slice(0, 10)}] Server running at http://localhost:${PORT}`);
});
