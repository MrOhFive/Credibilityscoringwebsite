import { spawn } from 'node:child_process';
import { request } from 'node:http';

const BACKEND_PORT = Number(process.env.PORT || 3001);

function checkExistingBackend() {
  return new Promise((resolve) => {
    const req = request(
      {
        host: '127.0.0.1',
        port: BACKEND_PORT,
        path: '/api/health',
        timeout: 500,
      },
      (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(res.statusCode === 200 && data.status === 'ok');
          } catch {
            resolve(false);
          }
        });
      },
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

const processes = [];

if (await checkExistingBackend()) {
  console.log(`Backend API already running at http://localhost:${BACKEND_PORT}`);
} else {
  processes.push(spawn('node', ['server/index.js'], { stdio: 'inherit' }));
}

processes.push(spawn('npx', ['vite'], { stdio: 'inherit', shell: process.platform === 'win32' }));

function shutdown(signal) {
  for (const child of processes) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shutdown(signal);
    process.exit(0);
  });
}

for (const child of processes) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown('SIGTERM');
      process.exit(code);
    }
  });
}
