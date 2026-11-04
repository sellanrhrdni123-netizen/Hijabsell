const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIR = __dirname;
const DB_FILE = path.join(DIR, 'synced_db.json');

// In-memory synchronized state with fallback to file
let latestSyncState = {
  data: { products: [], orders: [], customers: [], activities: [], followups: [] },
  chats: [],
  storeSettings: {},
  lastUpdated: Date.now()
};

try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    latestSyncState = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Could not load synced_db.json, starting fresh');
}

function persistState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(latestSyncState, null, 2), 'utf8');
  } catch (e) {}
}

const sseClients = new Set();

// Send heartbeat every 15s to keep connections alive across mobile & laptop
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch (e) {
      sseClients.delete(client);
    }
  }
}, 15000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost:3000'));
  const pathname = parsedUrl.pathname;

  // --- API ROUTE 1: Local Real-Time SSE Stream ---
  if (pathname === '/api/sync/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(': connected\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // --- API ROUTE 2: Broadcast Update Across All Clients ---
  if (pathname === '/api/sync/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        
        // Update server persistent state
        if (payload.data) {
          latestSyncState.data = payload.data;
        }
        if (payload.chats) {
          latestSyncState.chats = payload.chats;
        }
        if (payload.storeSettings) {
          latestSyncState.storeSettings = payload.storeSettings;
        }
        latestSyncState.lastUpdated = Date.now();
        persistState();

        // Broadcast immediately to all connected clients (Laptop and HP)
        const sseMessage = 'data: ' + JSON.stringify(payload) + '\n\n';
        for (const client of sseClients) {
          try {
            client.write(sseMessage);
          } catch (e) {
            sseClients.delete(client);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, activeClients: sseClients.size }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // --- API ROUTE 3: Initial Full State for New Clients ---
  if (pathname === '/api/sync/data' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(latestSyncState));
    return;
  }

  // --- Static File Serving ---
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  const filePath = path.join(DIR, reqPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA
      const indexPath = path.join(DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at:`);
  console.log(`- Laptop: http://localhost:${PORT}/`);
  console.log(`- HP:     http://172.20.10.14:${PORT}/`);
  console.log(`- Real-Time Localhost Sync: ACTIVE on port ${PORT}`);
});
