const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function resolvePythonExecutable() {
  const candidates = [
    path.resolve(__dirname, '../../.venv-catface-id/Scripts/python.exe'),
    path.resolve(process.cwd(), '.venv-catface-id/Scripts/python.exe'),
    'python'
  ];

  for (const candidate of candidates) {
    if (candidate === 'python') return candidate;
    if (fs.existsSync(candidate)) return candidate;
  }

  return 'python';
}

function runKamFaceInference(imageDataUrl) {
  return new Promise((resolve, reject) => {
    const pythonExecutable = resolvePythonExecutable();
    const scriptPath = path.resolve(__dirname, '../../scripts/kam_face_service.py');
    const backendRoot = path.resolve(__dirname, '../..');

    const child = spawn(pythonExecutable, [scriptPath], {
      cwd: backendRoot,
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || stdout || `Cat face python exited with code ${code}`));
      }

      try {
        const payload = JSON.parse(stdout);
        if (!payload.success) {
          return reject(new Error(payload.message || 'Cat face identification failed'));
        }
        resolve(payload);
      } catch (error) {
        reject(new Error(`Invalid cat face response: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify({
      image_data_url: imageDataUrl
    }));
    child.stdin.end();
  });
}

module.exports = {
  runKamFaceInference
};