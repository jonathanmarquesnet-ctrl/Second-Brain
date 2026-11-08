import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = 3005;
const ROOT_DIR = process.cwd();
const TMP_SYNC_FILE = path.join(ROOT_DIR, '.second-brain-sync.tmp');
const FINAL_SYNC_FILE = path.join(ROOT_DIR, '.second-brain-sync.json');

class MutexQueue {
  constructor() {
    this.promise = Promise.resolve();
  }
  enqueue(task) {
    const next = this.promise.then(task, task);
    this.promise = next.catch(() => {});
    return next;
  }
}

const mutex = new MutexQueue();

async function atomicWriteSyncState(payload) {
  return mutex.enqueue(async () => {
    const data = JSON.stringify(
      { updatedAt: new Date().toISOString(), ...payload },
      null,
      2
    );
    await fs.writeFile(TMP_SYNC_FILE, data, 'utf-8');
    await fs.rename(TMP_SYNC_FILE, FINAL_SYNC_FILE);
    return { synced: true, file: FINAL_SYNC_FILE };
  });
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || '/';

  if (req.method === 'GET' && url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', layer: 1, port: PORT, daemon: 'mcp-bridge' }));
    return;
  }

  if (req.method === 'POST' && url === '/mcp/sync') {
    try {
      const raw = await readBody(req);
      const parsed = raw ? JSON.parse(raw) : {};
      const result = await atomicWriteSyncState(parsed);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Sync failed' }));
    }
    return;
  }

  if (req.method === 'POST' && url === '/mcp/tool') {
    try {
      const raw = await readBody(req);
      const { name, args } = raw ? JSON.parse(raw) : {};
      if (name === 'read_project_file' && args?.file_path) {
        const safePath = path.resolve(ROOT_DIR, String(args.file_path));
        if (!safePath.startsWith(ROOT_DIR)) throw new Error('Acesso fora do diretório raiz negado');
        const content = await mutex.enqueue(() => fs.readFile(safePath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ file: args.file_path, content }));
        return;
      }
      const syncResult = await atomicWriteSyncState({ lastTool: name, args });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, daemon: true, syncResult }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Tool error' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Handshake WebSocket RFC 6455 nativo sem dependências externas
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');

  socket.write(
    [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '\r\n',
    ].join('\r\n')
  );

  socket.on('error', () => socket.destroy());
});

server.listen(PORT, () => {
  console.log(`[Deca-Engine L1] MCP Bridge Daemon online em http://localhost:${PORT}`);
});
