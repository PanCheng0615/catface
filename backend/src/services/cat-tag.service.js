const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = path.join(__dirname, '../..');
const TAG_SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts/cat_tag_suggester.py');
const TAG_VOCAB_PATH = path.join(PROJECT_ROOT, 'src/data/cat-tag-vocabulary.json');

function resolveTagPythonBin() {
  if (process.env.CAT_TAG_PYTHON_BIN) {
    return process.env.CAT_TAG_PYTHON_BIN;
  }

  const candidatePaths = [
    path.join(PROJECT_ROOT, '.venv-catface-id', 'Scripts', 'python.exe'),
    path.join(PROJECT_ROOT, '.venv-catface-id', 'Scripts', 'python'),
    path.join(PROJECT_ROOT, '.venv-catface-id', 'bin', 'python')
  ];

  const bundledPython = candidatePaths.find((candidate) => fsSync.existsSync(candidate));
  if (bundledPython) {
    return bundledPython;
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

const TAG_PYTHON_BIN = resolveTagPythonBin();

let vocabularyCache = null;
let aliasLookupCache = null;

async function getCatTagVocabulary() {
  if (vocabularyCache) {
    return vocabularyCache;
  }

  const payload = await fs.readFile(TAG_VOCAB_PATH, 'utf8');
  vocabularyCache = JSON.parse(payload);
  return vocabularyCache;
}

async function getTagAliasLookup() {
  if (aliasLookupCache) {
    return aliasLookupCache;
  }

  const vocabulary = await getCatTagVocabulary();
  const lookup = new Map();

  vocabulary.tags.forEach((entry) => {
    const canonical = normalizeAlias(entry.tag);
    if (canonical) {
      lookup.set(canonical, entry.tag);
    }

    (entry.aliases || []).forEach((alias) => {
      const normalized = normalizeAlias(alias);
      if (normalized) {
        lookup.set(normalized, entry.tag);
      }
    });
  });

  aliasLookupCache = lookup;
  return aliasLookupCache;
}

function normalizeAlias(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function extractDelimitedTags(tagText) {
  const value = String(tagText || '').trim();
  if (!value || !/[，,、/|；;]/.test(value)) {
    return [];
  }

  return value
    .split(/[，,、/|；;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function normalizeManualTagValues(tagValues) {
  const aliasLookup = await getTagAliasLookup();
  const unique = [];

  (Array.isArray(tagValues) ? tagValues : []).forEach((tag) => {
    const normalized = String(tag || '').trim();
    if (!normalized) {
      return;
    }

    const canonical = aliasLookup.get(normalizeAlias(normalized)) || normalized;
    if (!unique.includes(canonical)) {
      unique.push(canonical);
    }
  });

  return unique.slice(0, 12);
}

async function suggestCatTags({ personality, health, notes, candidateTags, limit }) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'catface-tags-'));
  const inputPath = path.join(tempDir, 'payload.json');

  try {
    const payload = {
      personality: typeof personality === 'string' ? personality.trim() : '',
      health: typeof health === 'string' ? health.trim() : '',
      notes: typeof notes === 'string' ? notes.trim() : '',
      candidate_tags: Array.isArray(candidateTags) ? candidateTags : undefined,
      limit: typeof limit === 'number' ? limit : Number(limit) || 5
    };

    await fs.writeFile(inputPath, JSON.stringify(payload, null, 2), 'utf8');

    const { stdout, stderr } = await execFileAsync(TAG_PYTHON_BIN, [TAG_SCRIPT_PATH, inputPath], {
      cwd: PROJECT_ROOT,
      maxBuffer: 1024 * 1024 * 10
    });

    let response;
    try {
      response = JSON.parse(stdout || '{}');
    } catch (error) {
      const parseError = new Error(`Unable to parse Python response: ${stdout || stderr || error.message}`);
      parseError.code = 'InvalidPythonResponse';
      throw parseError;
    }

    if (!response.success) {
      const serviceError = new Error(response.message || 'Cat tag suggestion failed');
      serviceError.code = response.error || 'CatTagSuggestionFailed';
      serviceError.statusCode = response.status_code || 500;
      throw serviceError;
    }

    if (stderr && stderr.trim() && !response.warning) {
      response.warning = stderr.trim();
    }

    return response;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

module.exports = {
  extractDelimitedTags,
  getCatTagVocabulary,
  normalizeManualTagValues,
  suggestCatTags
};
