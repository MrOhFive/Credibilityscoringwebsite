import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import { analyzeText, generateExplanation } from './credibilityScorer.js';

loadLocalEnv();

const PORT = Number(process.env.PORT || 3001);
const MAX_BODY_SIZE = 1_000_000;
const DIST_DIR = resolve(process.cwd(), 'dist');
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function sendStaticFile(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = '';

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    sendJson(res, 400, { error: 'Bad request.' });
    return;
  }

  if (pathname.includes('\0')) {
    sendJson(res, 400, { error: 'Bad request.' });
    return;
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const requestedPath = resolve(DIST_DIR, `.${pathname}`);
  const relativePath = relative(DIST_DIR, requestedPath);
  const filePath =
    relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath)
      ? requestedPath
      : join(DIST_DIR, 'index.html');
  const fallbackPath = join(DIST_DIR, 'index.html');
  const staticPath =
    existsSync(filePath) && statSync(filePath).isFile() ? filePath : fallbackPath;

  if (!existsSync(staticPath)) {
    sendJson(res, 404, { error: 'Build output not found. Run npm run build first.' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME_TYPES[extname(staticPath)] || 'application/octet-stream',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(staticPath).pipe(res);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });

    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/analyze') {
    try {
      const body = await readJsonBody(req);
      const text = typeof body.text === 'string' ? body.text.trim() : '';

      if (!text) {
        sendJson(res, 400, { error: 'Text is required.' });
        return;
      }

      const analysis = analyzeText(text);
      const explanation = await generateExplanation(text, analysis);

      sendJson(res, 200, {
        ...analysis,
        explanation,
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Unable to analyze text.' });
    }

    return;
  }

  sendStaticFile(req, res);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend or set PORT to another value.`);
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
