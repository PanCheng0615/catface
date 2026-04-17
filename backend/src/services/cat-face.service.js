const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = path.join(__dirname, '../..');
const FACE_SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts/kam_face_service.py');

function resolvePythonRuntime() {
  const envPython = process.env.KAM_FACE_PYTHON_BIN
    ? path.resolve(PROJECT_ROOT, process.env.KAM_FACE_PYTHON_BIN)
    : null;
  const venvWindowsPython = path.join(PROJECT_ROOT, '.venv-catface-id', 'Scripts', 'python.exe');
  const venvUnixPython = path.join(PROJECT_ROOT, '.venv-catface-id', 'bin', 'python');
  const directCandidates = [envPython, venvWindowsPython, venvUnixPython].filter(Boolean);

  for (const candidate of directCandidates) {
    if (fsSync.existsSync(candidate)) {
      return {
        command: candidate,
        argsPrefix: []
      };
    }
  }

  if (process.platform === 'win32') {
    return {
      command: 'py',
      argsPrefix: ['-3']
    };
  }

  return {
    command: 'python3',
    argsPrefix: []
  };
}

function decodeImageDataUrl(imageDataUrl) {
  const match = String(imageDataUrl || '').match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    const error = new Error('image_data_url must be a valid base64 data URL');
    error.code = 'InvalidImageData';
    throw error;
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const extension = mimeType.split('/')[1] || 'jpg';

  return {
    mimeType,
    extension,
    buffer: Buffer.from(base64Data, 'base64')
  };
}

async function withTempImage(imageDataUrl, callback) {
  const { buffer, extension } = decodeImageDataUrl(imageDataUrl);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'catface-kam-'));
  const imagePath = path.join(tempDir, `input.${extension}`);

  await fs.writeFile(imagePath, buffer);

  try {
    return await callback(imagePath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runKamFaceInference(imageDataUrl) {
  return withTempImage(imageDataUrl, async (imagePath) => {
    const runtime = resolvePythonRuntime();
    let stdout;
    let stderr;

    try {
      const result = await execFileAsync(runtime.command, [...runtime.argsPrefix, FACE_SCRIPT_PATH, imagePath], {
        cwd: PROJECT_ROOT,
        maxBuffer: 1024 * 1024 * 20
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      const combinedMessage = [error.message, error.stderr, error.stdout]
        .filter(Boolean)
        .join('\n')
        .trim();
      const runtimeError = new Error(
        combinedMessage || 'Python runtime for cat face recognition is unavailable.'
      );
      if (
        error.code === 'ENOENT' ||
        /Unable to create process/i.test(combinedMessage) ||
        /CommandNotFoundException/i.test(combinedMessage)
      ) {
        runtimeError.code = 'PythonRuntimeMissing';
        runtimeError.message =
          'Cat face recognition requires a working Python runtime. Install Python, create `backend/.venv-catface-id`, and install `KAM_Face_pipeline_demo/requirements.txt`.';
      } else {
        runtimeError.code = error.code || 'PythonExecutionFailed';
      }
      throw runtimeError;
    }

    let payload;

    try {
      payload = JSON.parse(stdout || '{}');
    } catch (error) {
      const parseError = new Error(`Unable to parse Python response: ${stdout || stderr || error.message}`);
      parseError.code = 'InvalidPythonResponse';
      throw parseError;
    }

    if (stderr && !payload.warning) {
      payload.warning = stderr.trim();
    }

    return payload;
  });
}

function cosineSimilarity(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB) || !vectorA.length || vectorA.length !== vectorB.length) {
    return null;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    const a = Number(vectorA[index]);
    const b = Number(vectorB[index]);

    if (Number.isNaN(a) || Number.isNaN(b)) {
      return null;
    }

    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (!normA || !normB) {
    return null;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function findCatFaceMatches(prisma, embedding, threshold) {
  try {
    const rows = await prisma.catFaceEmbedding.findMany({
      include: {
        cat: {
          select: {
            id: true,
            name: true,
            face_code: true,
            photo_url: true,
            status: true
          }
        }
      }
    });

    const scored = rows
      .map((row) => {
        const score = cosineSimilarity(embedding, row.embedding_json);
        if (score === null) {
          return null;
        }

        return {
          embedding_id: row.id,
          similarity: Number(score.toFixed(6)),
          provider: row.provider,
          source_photo_url: row.source_photo_url,
          created_at: row.created_at,
          cat: row.cat
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.similarity - left.similarity);

    return {
      bestMatch: scored.find((item) => item.similarity >= threshold) || null,
      topMatches: scored.slice(0, 5),
      note: null
    };
  } catch (error) {
    return {
      bestMatch: null,
      topMatches: [],
      note: `Embedding table is not ready yet: ${error.message}`
    };
  }
}

module.exports = {
  runKamFaceInference,
  findCatFaceMatches
};
