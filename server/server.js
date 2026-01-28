import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import tasksRouter from './routes/tasks.js';
import boardsRouter from './routes/boards.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api/tasks', tasksRouter);
app.use('/api/boards', boardsRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString().slice(0, 10)}] Server running at http://localhost:${PORT}`);
});
