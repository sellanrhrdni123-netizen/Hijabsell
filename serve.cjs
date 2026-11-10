const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const DIR = __dirname;
const DB_FILE = path.join(DIR, 'synced_db.json');

function getLocalIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {}
  return 'localhost';
}

// In-memory synchronized state with fallback to file
let latestSyncState = {
  data: { products: [], orders: [], customers: [], activities: [], followups: [], deletedIds: [] },
  chats: [],
  storeSettings: {},
  users: {},
  deletedIds: [],
  lastUpdated: Date.now()
};

try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    latestSyncState = {
      ...latestSyncState,
      ...parsed,
      data: {
        products: [],
        orders: [],
        customers: [],
        activities: [],
        followups: [],
        deletedIds: [],
        ...(parsed.data || {})
      },
      users: parsed.users || {},
      deletedIds: parsed.deletedIds || (parsed.data && parsed.data.deletedIds) || []
    };
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
        if (!latestSyncState.data) {
          latestSyncState.data = { products: [], orders: [], customers: [], activities: [], followups: [], deletedIds: [] };
        }
        
        // 1. Full data update
        if (payload.data && typeof payload.data === 'object') {
          latestSyncState.data = payload.data;
          if (Array.isArray(payload.data.deletedIds)) {
            latestSyncState.deletedIds = Array.from(new Set([...(latestSyncState.deletedIds || []), ...payload.data.deletedIds]));
          }
        }
        if (Array.isArray(payload.deletedIds)) {
          latestSyncState.deletedIds = Array.from(new Set([...(latestSyncState.deletedIds || []), ...payload.deletedIds]));
        }

        // 2. Specific Deletion Events
        if (payload.type === 'PRODUCT_DELETE' && payload.productId) {
          if (latestSyncState.data.products) {
            latestSyncState.data.products = latestSyncState.data.products.filter(p => p.id !== payload.productId);
          }
          latestSyncState.deletedIds = latestSyncState.deletedIds || [];
          if (!latestSyncState.deletedIds.includes(payload.productId)) latestSyncState.deletedIds.push(payload.productId);
        }
        if (payload.type === 'ORDER_DELETE' && payload.orderId) {
          if (latestSyncState.data.orders) {
            latestSyncState.data.orders = latestSyncState.data.orders.filter(o => o.id !== payload.orderId);
          }
          if (Array.isArray(payload.products)) {
            latestSyncState.data.products = payload.products;
          }
          latestSyncState.deletedIds = latestSyncState.deletedIds || [];
          if (!latestSyncState.deletedIds.includes(payload.orderId)) latestSyncState.deletedIds.push(payload.orderId);
        }
        if (payload.type === 'CUSTOMER_DELETE' && payload.customerId) {
          if (latestSyncState.data.customers) {
            latestSyncState.data.customers = latestSyncState.data.customers.filter(c => c.id !== payload.customerId);
          }
          latestSyncState.deletedIds = latestSyncState.deletedIds || [];
          if (!latestSyncState.deletedIds.includes(payload.customerId)) latestSyncState.deletedIds.push(payload.customerId);
        }
        if (payload.type === 'FOLLOWUP_DELETE' && payload.followupId) {
          if (latestSyncState.data.followups) {
            latestSyncState.data.followups = latestSyncState.data.followups.filter(f => f.id !== payload.followupId);
          }
          latestSyncState.deletedIds = latestSyncState.deletedIds || [];
          if (!latestSyncState.deletedIds.includes(payload.followupId)) latestSyncState.deletedIds.push(payload.followupId);
        }
        if (payload.type === 'RESET_EMPTY_STATE') {
          latestSyncState.data = { products: [], orders: [], customers: [], activities: [], followups: [], deletedIds: [] };
          latestSyncState.deletedIds = [];
        }
        if (payload.type === 'LOAD_SAMPLE_DATA' && payload.data) {
          latestSyncState.data = payload.data;
        }

        // 3. Specific Entity Updates
        if (payload.order && typeof payload.order === 'object' && payload.order.id) {
          if (!latestSyncState.data.orders) latestSyncState.data.orders = [];
          const oIdx = latestSyncState.data.orders.findIndex(o => o.id === payload.order.id);
          if (oIdx === -1) {
            latestSyncState.data.orders.unshift(payload.order);
          } else {
            latestSyncState.data.orders[oIdx] = { ...latestSyncState.data.orders[oIdx], ...payload.order };
          }
        }
        if (payload.product && typeof payload.product === 'object' && payload.product.id) {
          if (!latestSyncState.data.products) latestSyncState.data.products = [];
          const idx = latestSyncState.data.products.findIndex(p => p.id === payload.product.id);
          if (idx === -1) {
            latestSyncState.data.products.unshift(payload.product);
          } else {
            latestSyncState.data.products[idx] = { ...latestSyncState.data.products[idx], ...payload.product };
          }
        }
        if (Array.isArray(payload.products)) {
          latestSyncState.data.products = payload.products;
        }
        if (payload.customer && typeof payload.customer === 'object' && (payload.customer.id || payload.customer.email)) {
          if (!latestSyncState.data.customers) latestSyncState.data.customers = [];
          const cIdx = latestSyncState.data.customers.findIndex(c => 
            (payload.customer.id && c.id === payload.customer.id) ||
            (payload.customer.email && c.email && c.email.toLowerCase() === payload.customer.email.toLowerCase())
          );
          if (cIdx === -1) {
            latestSyncState.data.customers.unshift(payload.customer);
          } else {
            latestSyncState.data.customers[cIdx] = { ...latestSyncState.data.customers[cIdx], ...payload.customer };
          }
        }
        if (payload.activity && typeof payload.activity === 'object' && payload.activity.id) {
          if (!latestSyncState.data.activities) latestSyncState.data.activities = [];
          if (!latestSyncState.data.activities.some(a => a.id === payload.activity.id)) {
            latestSyncState.data.activities.unshift(payload.activity);
          }
        }
        if (payload.followup && typeof payload.followup === 'object' && payload.followup.id) {
          if (!latestSyncState.data.followups) latestSyncState.data.followups = [];
          const fIdx = latestSyncState.data.followups.findIndex(f => f.id === payload.followup.id);
          if (fIdx === -1) {
            latestSyncState.data.followups.unshift(payload.followup);
          } else {
            latestSyncState.data.followups[fIdx] = { ...latestSyncState.data.followups[fIdx], ...payload.followup };
          }
        }

        // 4. Users, Chats, and Store Settings
        if (payload.users && typeof payload.users === 'object') {
          latestSyncState.users = { ...(latestSyncState.users || {}), ...payload.users };
        }
        if (payload.chats) {
          latestSyncState.chats = payload.chats;
        }
        if (payload.storeSettings) {
          latestSyncState.storeSettings = payload.storeSettings;
        }

        // 5. Purge any deleted items from latestSyncState
        if (latestSyncState.deletedIds && latestSyncState.deletedIds.length > 0) {
          const dSet = new Set(latestSyncState.deletedIds);
          if (latestSyncState.data.products) latestSyncState.data.products = latestSyncState.data.products.filter(p => !dSet.has(p.id));
          if (latestSyncState.data.orders) latestSyncState.data.orders = latestSyncState.data.orders.filter(o => !dSet.has(o.id));
          if (latestSyncState.data.customers) latestSyncState.data.customers = latestSyncState.data.customers.filter(c => !dSet.has(c.id));
          if (latestSyncState.data.followups) latestSyncState.data.followups = latestSyncState.data.followups.filter(f => !dSet.has(f.id));
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

const localIp = getLocalIp();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at:`);
  console.log(`- Laptop: http://localhost:${PORT}/`);
  console.log(`- HP:     http://${localIp}:${PORT}/`);
  console.log(`- Real-Time Localhost Sync: ACTIVE on port ${PORT}`);
});
