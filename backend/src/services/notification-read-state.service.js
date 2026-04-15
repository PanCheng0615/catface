const fs = require('fs/promises');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../../data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'notification-read-state.json');

async function ensureStorageFile() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  try {
    await fs.access(STORAGE_FILE);
  } catch (error) {
    await fs.writeFile(STORAGE_FILE, '{}', 'utf8');
  }
}

async function readState() {
  await ensureStorageFile();
  try {
    const raw = await fs.readFile(STORAGE_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

async function writeState(state) {
  await ensureStorageFile();
  await fs.writeFile(STORAGE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

async function loadReadSet(userId, notificationIds) {
  const state = await readState();
  const stored = Array.isArray(state[userId]) ? state[userId] : [];
  const allowedIds = new Set(notificationIds || []);
  return new Set(stored.filter((id) => allowedIds.has(id)));
}

async function markAsRead(userId, notificationIds) {
  const normalizedIds = (Array.isArray(notificationIds) ? notificationIds : [])
    .map((id) => String(id || '').trim())
    .filter(Boolean);

  if (!userId || !normalizedIds.length) {
    return 0;
  }

  const state = await readState();
  const existing = new Set(Array.isArray(state[userId]) ? state[userId] : []);
  let added = 0;

  normalizedIds.forEach((id) => {
    if (!existing.has(id)) {
      existing.add(id);
      added += 1;
    }
  });

  state[userId] = Array.from(existing);
  await writeState(state);
  return added;
}

module.exports = {
  loadReadSet,
  markAsRead
};
