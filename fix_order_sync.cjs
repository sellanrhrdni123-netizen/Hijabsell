const fs = require('fs');

console.log('=== FIXING ORDER SYNC & VERCEL/LOCALHOST DUAL SYNC ===');

// 1. Update serve.cjs
let serve = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/serve.cjs', 'utf8');

const targetServeOrder = `        if (payload.data) {
          latestSyncState.data = payload.data;
        }`;

const replacementServeOrder = `        if (payload.data) {
          latestSyncState.data = payload.data;
        }
        if (payload.order && typeof payload.order === 'object' && payload.order.id) {
          if (!latestSyncState.data) latestSyncState.data = { products: [], orders: [], customers: [], activities: [], followups: [] };
          if (!latestSyncState.data.orders) latestSyncState.data.orders = [];
          const oIdx = latestSyncState.data.orders.findIndex(o => o.id === payload.order.id);
          if (oIdx === -1) {
            latestSyncState.data.orders.unshift(payload.order);
          } else {
            latestSyncState.data.orders[oIdx] = { ...latestSyncState.data.orders[oIdx], ...payload.order };
          }
        }`;

if (serve.includes(targetServeOrder)) {
  serve = serve.replace(targetServeOrder, replacementServeOrder);
  fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/serve.cjs', serve, 'utf8');
  console.log('serve.cjs updated with order payload support!');
}

// 2. Update app.html
let app = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', 'utf8');

// A. In processCustomerPurchase: broadcast the newly created order explicitly
const oldPurchaseEnd = `      state.data = {
        customers: syncedCusts,
        products: updatedProducts,
        orders: updatedOrders,
        followups: state.data.followups || [],
        activities: newActivities
      };
      saveData(state.data);

      state.activeModal = null;
      state.modalPayload = null;
      alert('Alhamdulillah! Pesanan ' + newOrder.id + ' berhasil dibuat.');
      render();
    }`;

const newPurchaseEnd = `      state.data = {
        customers: syncedCusts,
        products: updatedProducts,
        orders: updatedOrders,
        followups: state.data.followups || [],
        activities: newActivities
      };
      saveData(state.data);

      // Explicit instant broadcast for newly placed customer order
      try {
        if (typeof App !== 'undefined' && App.broadcastCloudSync) {
          App.broadcastCloudSync({
            type: 'ORDER_CREATE',
            order: newOrder,
            products: updatedProducts,
            customer: syncedCusts.find(function(c) { return c.id === custId; }) || { id: custId, name: custName, phone: custPhone, email: custEmail, address: address },
            activity: newActivities[0],
            timestamp: Date.now()
          });
        }
      } catch(e) {}

      state.activeModal = null;
      state.modalPayload = null;
      alert('Alhamdulillah! Pesanan ' + newOrder.id + ' berhasil dibuat.');
      render();
    }`;

if (app.includes(oldPurchaseEnd)) {
  app = app.replace(oldPurchaseEnd, newPurchaseEnd);
  console.log('processCustomerPurchase explicit broadcast added!');
} else {
  console.error('Target oldPurchaseEnd not found!');
  process.exit(1);
}

// B. In handleIncomingSync: handle direct packet.order
const targetIncomingOrder = `            // Merge Orders
            if (Array.isArray(remote.orders)) {`;

const replacementIncomingOrder = `            // Direct single order creation handling
            if (packet.order && typeof packet.order === 'object' && packet.order.id) {
              const ro = packet.order;
              const localOrders = state.data.orders || [];
              const oIdx = localOrders.findIndex(function(lo) { return lo.id === ro.id; });
              if (oIdx === -1) {
                localOrders.unshift(ro);
                hasChanges = true;
              } else {
                localOrders[oIdx] = { ...localOrders[oIdx], ...ro };
                hasChanges = true;
              }
              state.data.orders = localOrders;
            }

            // Merge Orders
            if (Array.isArray(remote.orders)) {`;

if (app.includes(targetIncomingOrder)) {
  app = app.replace(targetIncomingOrder, replacementIncomingOrder);
  console.log('handleIncomingSync direct order handling added!');
} else {
  console.error('Target targetIncomingOrder not found!');
  process.exit(1);
}

// C. Fix Vercel vs Localhost detection in initCloudSync
const oldSSELogic = `            const room = App.getSyncRoom();
            const isHttp = typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http');
            const sseUrl = isHttp ? '/api/sync/events' : ('https://ntfy.sh/' + encodeURIComponent(room) + '/sse');`;

const newSSELogic = `            const room = App.getSyncRoom();
            const isLocalHost = typeof window !== 'undefined' && window.location && (
              window.location.hostname === 'localhost' ||
              window.location.hostname === '127.0.0.1' ||
              window.location.port === '3000' ||
              /^172\.|^192\.168\.|^10\./.test(window.location.hostname)
            );
            // On localhost use local Node server /api/sync/events; on Vercel or cloud use ntfy.sh SSE!
            const sseUrl = isLocalHost ? '/api/sync/events' : ('https://ntfy.sh/' + encodeURIComponent(room) + '/sse');`;

if (app.includes(oldSSELogic)) {
  app = app.replace(oldSSELogic, newSSELogic);
  console.log('initCloudSync Vercel vs Localhost SSE fixed!');
} else {
  console.error('Target oldSSELogic not found!');
  process.exit(1);
}

// D. Fix initial data fetch in initCloudSync (only fetch /api/sync/data if on localhost)
const oldDataFetch = `            if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
              fetch('/api/sync/data', { cache: 'no-store' })`;

const newDataFetch = `            const isLocalHost = typeof window !== 'undefined' && window.location && (
              window.location.hostname === 'localhost' ||
              window.location.hostname === '127.0.0.1' ||
              window.location.port === '3000' ||
              /^172\.|^192\.168\.|^10\./.test(window.location.hostname)
            );
            if (isLocalHost) {
              fetch('/api/sync/data', { cache: 'no-store' })`;

if (app.includes(oldDataFetch)) {
  app = app.replace(oldDataFetch, newDataFetch);
  console.log('initCloudSync initial data fetch fixed!');
} else {
  console.error('Target oldDataFetch not found!');
  process.exit(1);
}

fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', app, 'utf8');
fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html', app, 'utf8');

const match = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html').equals(fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html'));
console.log('app.html and index.html byte-for-byte identical:', match);
