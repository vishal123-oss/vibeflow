import fs from 'fs/promises';
import path from 'path';
import { DATA_ROOT } from '../config.js';
import { StatusCodes } from '../constants.js';

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function getRecordPath(entity, id) {
  const safeId = id.replace(/[^a-zA-Z0-9-]/g, '-');
  return path.join(DATA_ROOT, entity, `${entity}-${safeId}.json`);
}

async function getIndexPath(entity) {
  return path.join(DATA_ROOT, entity, 'index.json');
}

async function readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    const error = new Error(`Failed to read ${filePath}: ${err.message}`);
    error.code = err.code;
    error.status = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }
}

async function readJson(filePath) {
  try {
    const content = await readFile(filePath);
    if (!content) return null;
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    const error = new Error(`Invalid JSON in ${filePath}: ${err.message}`);
    error.status = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }
}

async function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    await ensureDir(dir);
    await fs.writeFile(filePath, content, 'utf8');
    return content;
  } catch (err) {
    const error = new Error(`Failed to write ${filePath}: ${err.message}`);
    error.status = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }
}

async function writeJson(filePath, data) {
  try {
    if (!data) throw new Error('No data to write');
    const content = JSON.stringify(data, null, 2);
    return await writeFile(filePath, content);
  } catch (err) {
    const error = new Error(`Failed to serialize/write JSON to ${filePath}: ${err.message}`);
    error.status = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }
}

async function updateJson(filePath, updater) {
  try {
    let data = await readJson(filePath) || {};
    const updated = await updater(data);
    return await writeJson(filePath, updated);
  } catch (err) {
    const error = new Error(`Update failed for ${filePath}: ${err.message}`);
    error.status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }
}

async function listFiles(dirPath) {
  try {
    await ensureDir(dirPath);
    const files = await fs.readdir(dirPath);
    return files.filter(f => f.endsWith('.json') && f !== 'index.json');
  } catch (err) {
    const error = new Error(`Failed to list ${dirPath}: ${err.message}`);
    error.status = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }
}

// Core ops for per-entity records (e.g. user-userId.json in users/ folder)
export async function getRecord(entity, id) {
  const filePath = await getRecordPath(entity, id);
  return readJson(filePath);
}

export async function saveRecord(entity, record) {
  if (!record || !record.id) throw new Error('Record must have id');
  const filePath = await getRecordPath(entity, record.id);
  await writeJson(filePath, record);
  await updateIndex(entity, record.id, true);
  return record;
}

export async function deleteRecord(entity, id) {
  try {
    const filePath = await getRecordPath(entity, id);
    await fs.unlink(filePath);
    await updateIndex(entity, id, false);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    const error = new Error(`Delete failed for ${entity}/${id}: ${err.message}`);
    error.status = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }
}

async function updateIndex(entity, id, add = true) {
  const indexPath = await getIndexPath(entity);
  return updateJson(indexPath, (index = []) => {
    const ids = index.filter(i => i !== id);
    if (add) ids.push(id);
    return ids.sort();
  });
}

export async function listRecords(entity, includeDetails = false) {
  const dirPath = path.join(DATA_ROOT, entity);
  const files = await listFiles(dirPath);
  const ids = files.map(f => f.replace(`${entity}-`, '').replace('.json', ''));
  if (!includeDetails) return ids;
  const records = [];
  for (const id of ids) {
    const rec = await getRecord(entity, id);
    if (rec) records.push(rec);
  }
  return records;
}

export async function getAllRecords(entity) {
  return listRecords(entity, true);
}

// Legacy helpers for collection files (if needed)
export {
  readFile,
  readJson,
  writeFile,
  writeJson,
  updateJson,
  DATA_ROOT
};
