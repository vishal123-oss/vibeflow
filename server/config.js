import dotenv from 'dotenv';

// Load .env file (must be first; statics moved to constants.js)
dotenv.config();

// Env-only exports (PORT, secrets, NODE_ENV, DATA_ROOT)
export const PORT = process.env.PORT ?? 4000;
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'vibeflow-demo-secret-key-change-in-prod';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'vibeflow-refresh-secret-change-in-prod';
export const DATA_ROOT = process.env.DATA_ROOT || '/testbed/vibeflow/server/data'; // fallback for safety
