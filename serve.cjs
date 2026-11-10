const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const DIR = __dirname;
const DB_FILE = path.join(DIR, 'synced_db.json');

function getNetworkIps() {
  const ips = [];
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const lowerName = name.toLowerCase();
      const isVirtual = /vethernet|virtual|vbox|vmnet|docker|wsl|loopback|pseudo/i.test(lowerName);
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          const addr = iface.address;
          if (!addr.startsWith('169.254.') && !addr.startsWith('192.168.56.')) {
            ips.push({
              name,
              address: addr,
              isVirtual,
              isWifi: /wi-fi|wifi|wireless|wlan/i.test(lowerName),
              isEthernet: /ethernet|lan/i.test(lowerName) && !isVirtual
            });
          }
        }
      }
    }
  } catch (e) {}
  return ips;
}

function getLocalIp() {
  const all = getNetworkIps();
  // 1. Prefer physical Wi-Fi interface
  const wifi = all.find(i => i.isWifi && !i.isVirtual);
  if (wifi) return wifi.address;
  // 2. Prefer physical Ethernet interface
  const eth = all.find(i => i.isEthernet && !i.isVirtual);
  if (eth) return eth.address;
  // 3. Prefer any non-virtual interface
  const nonVirtual = all.find(i => !i.isVirtual);
  if (nonVirtual) return nonVirtual.address;
  // 4. Any interface found
  if (all.length > 0) return all[0].address;
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

        // 1. Full data update vs Reset / Sample Data
        if (payload.type === 'RESET_EMPTY_STATE') {
          latestSyncState.data = { products: [], orders: [], customers: [], activities: [], followups: [], deletedIds: [] };
          latestSyncState.deletedIds = [];
        } else if (payload.type === 'LOAD_SAMPLE_DATA' && payload.data) {
          latestSyncState.data = payload.data;
          latestSyncState.deletedIds = [];
        } else {
          // Merge incoming deletedIds
          const incomingDeleted = [
            ...(Array.isArray(payload.deletedIds) ? payload.deletedIds : []),
            ...(payload.data && Array.isArray(payload.data.deletedIds) ? payload.data.deletedIds : [])
          ];
          if (incomingDeleted.length > 0) {
            latestSyncState.deletedIds = Array.from(new Set([...(latestSyncState.deletedIds || []), ...incomingDeleted]));
          }
          const delSet = new Set(latestSyncState.deletedIds || []);

          // Intelligent merge for payload.data
          if (payload.data && typeof payload.data === 'object') {
            // Products
            if (Array.isArray(payload.data.products)) {
              const curProds = latestSyncState.data.products || [];
              payload.data.products.forEach(p => {
                if (!p || !p.id || delSet.has(p.id)) return;
                const idx = curProds.findIndex(x => x.id === p.id);
                if (idx === -1) curProds.unshift(p);
                else curProds[idx] = { ...curProds[idx], ...p };
              });
              latestSyncState.data.products = curProds.filter(p => !delSet.has(p.id));
            }
            // Orders
            if (Array.isArray(payload.data.orders)) {
              const curOrders = latestSyncState.data.orders || [];
              payload.data.orders.forEach(o => {
                if (!o || !o.id || delSet.has(o.id)) return;
                const idx = curOrders.findIndex(x => x.id === o.id);
                if (idx === -1) curOrders.unshift(o);
                else curOrders[idx] = { ...curOrders[idx], ...o };
              });
              latestSyncState.data.orders = curOrders.filter(o => !delSet.has(o.id));
            }
            // Customers
            if (Array.isArray(payload.data.customers)) {
              const curCusts = latestSyncState.data.customers || [];
              payload.data.customers.forEach(c => {
                if (!c || (!c.id && !c.email) || (c.id && delSet.has(c.id))) return;
                const idx = curCusts.findIndex(x => (c.id && x.id === c.id) || (c.email && x.email && x.email.toLowerCase() === c.email.toLowerCase()));
                if (idx === -1) curCusts.push(c);
                else curCusts[idx] = { ...curCusts[idx], ...c };
              });
              latestSyncState.data.customers = curCusts.filter(c => !delSet.has(c.id));
            }
            // Activities
            if (Array.isArray(payload.data.activities)) {
              const curActs = latestSyncState.data.activities || [];
              const actIds = new Set(curActs.map(a => a.id));
              payload.data.activities.forEach(a => {
                if (a && a.id && !actIds.has(a.id)) {
                  curActs.unshift(a);
                  actIds.add(a.id);
                }
              });
              latestSyncState.data.activities = curActs.slice(0, 150);
            }
            // Followups
            if (Array.isArray(payload.data.followups)) {
              const curFlws = latestSyncState.data.followups || [];
              payload.data.followups.forEach(f => {
                if (!f || !f.id || delSet.has(f.id)) return;
                const idx = curFlws.findIndex(x => x.id === f.id);
                if (idx === -1) curFlws.unshift(f);
                else curFlws[idx] = { ...curFlws[idx], ...f };
              });
              latestSyncState.data.followups = curFlws.filter(f => !delSet.has(f.id));
            }
          }
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
        if (payload.type === 'CHAT_CLEAR') {
          if (payload.targetCustId) {
            const target = String(payload.targetCustId).trim().toLowerCase();
            latestSyncState.chats = (latestSyncState.chats || []).filter(m => {
              const mId = (m.customerId ? String(m.customerId) : '').toLowerCase();
              const mEmail = (m.customerEmail ? String(m.customerEmail) : '').toLowerCase();
              return mId !== target && mEmail !== target;
            });
          } else if (Array.isArray(payload.chats)) {
            latestSyncState.chats = payload.chats;
          }
        }

        // 3. Entity Creation / Update (Unmark from deletedIds if re-created)
        if (payload.product && typeof payload.product === 'object' && payload.product.id) {
          if (latestSyncState.deletedIds) {
            latestSyncState.deletedIds = latestSyncState.deletedIds.filter(id => id !== payload.product.id);
          }
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
        if (payload.order && typeof payload.order === 'object' && payload.order.id) {
          if (latestSyncState.deletedIds) {
            latestSyncState.deletedIds = latestSyncState.deletedIds.filter(id => id !== payload.order.id);
          }
          if (!latestSyncState.data.orders) latestSyncState.data.orders = [];
          const oIdx = latestSyncState.data.orders.findIndex(o => o.id === payload.order.id);
          if (oIdx === -1) {
            latestSyncState.data.orders.unshift(payload.order);
          } else {
            latestSyncState.data.orders[oIdx] = { ...latestSyncState.data.orders[oIdx], ...payload.order };
          }
        }
        if (payload.customer && typeof payload.customer === 'object' && (payload.customer.id || payload.customer.email)) {
          if (payload.customer.id && latestSyncState.deletedIds) {
            latestSyncState.deletedIds = latestSyncState.deletedIds.filter(id => id !== payload.customer.id);
          }
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
          if (latestSyncState.deletedIds) {
            latestSyncState.deletedIds = latestSyncState.deletedIds.filter(id => id !== payload.followup.id);
          }
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
        if (payload.chats && Array.isArray(payload.chats)) {
          latestSyncState.chats = payload.chats;
        }
        if (payload.storeSettings && typeof payload.storeSettings === 'object') {
          latestSyncState.storeSettings = payload.storeSettings;
        }

        // 5. Final Tombstone Purge
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
      'Cache-Control': 'no-cache, no-store, must-revalidate'
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
const allIps = getNetworkIps();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`  BY.NVDILA - SERVER SINKRONISASI REAL-TIME HP & LAPTOP`);
  console.log(`================================================================`);
  console.log(`- Laptop: http://localhost:${PORT}/`);
  console.log(`- HP:     http://${localIp}:${PORT}/`);
  if (allIps.length > 1) {
    console.log(`- Alamat IP alternatif yang terdeteksi:`);
    allIps.forEach(i => {
      if (i.address !== localIp) console.log(`    http://${i.address}:${PORT}/ (${i.name})`);
    });
  }
  console.log(`- Sinkronisasi Real-Time (SSE/HTTP): AKTIF`);
  console.log(`================================================================`);
});
