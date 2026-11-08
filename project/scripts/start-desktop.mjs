import { spawn, exec } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

function isServerReady(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await isServerReady(port);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function openStandaloneBrowser(url) {
  const platform = os.platform();
  if (platform === 'win32') {
    // Tenta Edge, depois Chrome, depois fallback
    exec(`start msedge --app=${url}`, (err) => {
      if (err) {
        exec(`start chrome --app=${url}`, (err2) => {
          if (err2) exec(`start ${url}`);
        });
      }
    });
  } else if (platform === 'darwin') {
    exec(`open -na "Microsoft Edge" --args --app=${url}`, (err) => {
      if (err) {
        exec(`open -na "Google Chrome" --args --app=${url}`, (err2) => {
          if (err2) exec(`open ${url}`);
        });
      }
    });
  } else {
    exec(`msedge --app=${url} || google-chrome --app=${url} || xdg-open ${url}`);
  }
}

console.log('[Second Brain] Iniciando servidor Next.js...');
const devProcess = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
  stdio: 'inherit',
  shell: true,
});

const ready = await waitForServer(PORT);
if (ready) {
  console.log(`[Second Brain] Servidor pronto em ${URL}. Abrindo janela Desktop...`);
  openStandaloneBrowser(URL);
} else {
  console.error('[Second Brain] Tempo limite atingido aguardando o servidor.');
}

process.on('SIGINT', () => {
  devProcess.kill();
  process.exit(0);
});
