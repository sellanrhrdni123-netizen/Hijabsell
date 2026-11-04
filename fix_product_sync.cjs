const fs = require('fs');

console.log('=== FIXING PRODUCT SYNC ===');

// 1. Update serve.cjs
let serve = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/serve.cjs', 'utf8');

const oldServePayload = `        // Update server persistent state
        if (payload.data) {
          latestSyncState.data = payload.data;
        }`;

const newServePayload = `        // Update server persistent state
        if (payload.data) {
          latestSyncState.data = payload.data;
        }
        if (payload.product && typeof payload.product === 'object' && payload.product.id) {
          if (!latestSyncState.data) latestSyncState.data = { products: [], orders: [], customers: [], activities: [], followups: [] };
          if (!latestSyncState.data.products) latestSyncState.data.products = [];
          const idx = latestSyncState.data.products.findIndex(p => p.id === payload.product.id);
          if (idx === -1) {
            latestSyncState.data.products.unshift(payload.product);
          } else {
            latestSyncState.data.products[idx] = { ...latestSyncState.data.products[idx], ...payload.product };
          }
        }
        if (payload.type === 'PRODUCT_DELETE' && payload.productId) {
          if (latestSyncState.data && latestSyncState.data.products) {
            latestSyncState.data.products = latestSyncState.data.products.filter(p => p.id !== payload.productId);
          }
        }`;

if (serve.includes(oldServePayload)) {
  serve = serve.replace(oldServePayload, newServePayload);
  fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/serve.cjs', serve, 'utf8');
  console.log('serve.cjs updated with product payload support!');
} else {
  console.log('serve.cjs already has product payload support.');
}

// 2. Update app.html
let app = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', 'utf8');

// A. Product Image Compression (max 240px, 0.6 quality for lightweight < 4KB packets)
const oldDim = 'const maxDim = 600;';
const newDim = 'const maxDim = 240;';
if (app.includes(oldDim)) {
  app = app.replace(oldDim, newDim);
}
const oldQuality = "const compressed = canvas.toDataURL('image/jpeg', 0.82);";
const newQuality = "const compressed = canvas.toDataURL('image/jpeg', 0.60);";
if (app.includes(oldQuality)) {
  app = app.replace(oldQuality, newQuality);
}

// B. saveProduct explicit product broadcast
const oldSaveProdEnd = `        if (p.id) {
          state.data.products = (state.data.products || []).map(x => x.id === p.id ? newProd : x);
        } else {
          state.data.products = [newProd, ...(state.data.products || [])];
        }
        saveData(state.data);
        state.activeModal = null;
        state.modalPayload = null;
        state.tempProductImage = '';
        render();
      },`;

const newSaveProdEnd = `        if (p.id) {
          state.data.products = (state.data.products || []).map(x => x.id === p.id ? newProd : x);
        } else {
          state.data.products = [newProd, ...(state.data.products || [])];
        }
        saveData(state.data);

        // Explicit instant broadcast for product addition/update
        try {
          if (typeof App !== 'undefined' && App.broadcastCloudSync) {
            App.broadcastCloudSync({
              type: 'PRODUCT_UPDATE',
              product: newProd,
              data: state.data,
              timestamp: Date.now()
            });
          }
        } catch(e) {}

        state.activeModal = null;
        state.modalPayload = null;
        state.tempProductImage = '';
        render();
      },`;

if (app.includes(oldSaveProdEnd)) {
  app = app.replace(oldSaveProdEnd, newSaveProdEnd);
  console.log('saveProduct broadcast added!');
}

// C. deleteProduct broadcast
const oldDeleteProd = `          state.data.products = (state.data.products || []).filter(x => x.id !== id);
          saveData(state.data);
          render();`;

const newDeleteProd = `          state.data.products = (state.data.products || []).filter(x => x.id !== id);
          saveData(state.data);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'PRODUCT_DELETE',
                productId: id,
                data: state.data,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();`;

if (app.includes(oldDeleteProd)) {
  app = app.replace(oldDeleteProd, newDeleteProd);
  console.log('deleteProduct broadcast added!');
}

// D. handleIncomingSync product handlers
const targetMergeProducts = `            // Merge Products
            if (Array.isArray(remote.products)) {
              const localProds = state.data.products || [];
              remote.products.forEach(function(rp) {
                if (!rp || !rp.id || dummyProdIds.includes(rp.id)) return;
                const idx = localProds.findIndex(function(lp) { return lp.id === rp.id; });
                if (idx === -1) {
                  localProds.push(rp);
                  hasChanges = true;
                } else {
                  const lp = localProds[idx];
                  if (lp.stock !== rp.stock || lp.price !== rp.price || lp.name !== rp.name || lp.color !== rp.color || lp.image !== rp.image || lp.status !== rp.status) {
                    localProds[idx] = { ...lp, ...rp };
                    hasChanges = true;
                  }
                }
              });
              state.data.products = localProds;
            }`;

const replacementMergeProducts = `            // Merge Products
            if (Array.isArray(remote.products)) {
              const localProds = state.data.products || [];
              remote.products.forEach(function(rp) {
                if (!rp || !rp.id) return;
                if (dummyProdIds.includes(rp.id) && !rp.name) return;
                const idx = localProds.findIndex(function(lp) { return lp.id === rp.id; });
                if (idx === -1) {
                  localProds.unshift(rp);
                  hasChanges = true;
                } else {
                  const lp = localProds[idx];
                  if (lp.stock !== rp.stock || lp.price !== rp.price || lp.name !== rp.name || lp.color !== rp.color || lp.image !== rp.image || lp.status !== rp.status || lp.category !== rp.category || lp.description !== rp.description) {
                    localProds[idx] = { ...lp, ...rp };
                    hasChanges = true;
                  }
                }
              });
              state.data.products = localProds;
            }

            // Direct single product update
            if (packet.product && typeof packet.product === 'object' && packet.product.id) {
              const rp = packet.product;
              const localProds = state.data.products || [];
              const idx = localProds.findIndex(function(lp) { return lp.id === rp.id; });
              if (idx === -1) {
                localProds.unshift(rp);
                hasChanges = true;
              } else {
                localProds[idx] = { ...localProds[idx], ...rp };
                hasChanges = true;
              }
              state.data.products = localProds;
            }

            // Direct single product deletion
            if (packet.type === 'PRODUCT_DELETE' && packet.productId) {
              const beforeLen = (state.data.products || []).length;
              state.data.products = (state.data.products || []).filter(function(p) { return p.id !== packet.productId; });
              if ((state.data.products || []).length !== beforeLen) {
                hasChanges = true;
              }
            }`;

if (app.includes(targetMergeProducts)) {
  app = app.replace(targetMergeProducts, replacementMergeProducts);
  console.log('handleIncomingSync product merge updated!');
}

// E. Support attachment URL fetching from ntfy
const oldSSEHandler = `            sse.onmessage = function(event) {
              try {
                if (!event || !event.data) return;
                const parsed = JSON.parse(event.data);
                if (parsed.event === 'message' && parsed.message) {
                  App.handleIncomingSync(parsed.message);
                } else {
                  App.handleIncomingSync(parsed);
                }
              } catch(err) {}
            };`;

const newSSEHandler = `            sse.onmessage = function(event) {
              try {
                if (!event || !event.data) return;
                const parsed = JSON.parse(event.data);
                if (parsed.attachment && parsed.attachment.url) {
                  fetch(parsed.attachment.url)
                    .then(function(r) { return r.text(); })
                    .then(function(txt) { App.handleIncomingSync(txt); })
                    .catch(function() {});
                  return;
                }
                if (parsed.event === 'message' && parsed.message) {
                  if (parsed.message.startsWith('You received a file:') && parsed.attachment && parsed.attachment.url) {
                    fetch(parsed.attachment.url).then(function(r) { return r.text(); }).then(function(t) { App.handleIncomingSync(t); }).catch(function() {});
                    return;
                  }
                  App.handleIncomingSync(parsed.message);
                } else {
                  App.handleIncomingSync(parsed);
                }
              } catch(err) {}
            };`;

if (app.includes(oldSSEHandler)) {
  app = app.replace(oldSSEHandler, newSSEHandler);
  console.log('SSE attachment handler added!');
}

// F. Support attachment URL in polling loop
const oldPollHandler = `                  try {
                    const item = JSON.parse(line);
                    if (item.event === 'message' && item.message) {
                      App.handleIncomingSync(item.message);
                    }
                  } catch(e) {}`;

const newPollHandler = `                  try {
                    const item = JSON.parse(line);
                    if (item.attachment && item.attachment.url) {
                      fetch(item.attachment.url).then(function(r) { return r.text(); }).then(function(t) { App.handleIncomingSync(t); }).catch(function() {});
                    } else if (item.event === 'message' && item.message) {
                      App.handleIncomingSync(item.message);
                    }
                  } catch(e) {}`;

if (app.includes(oldPollHandler)) {
  app = app.replace(oldPollHandler, newPollHandler);
  console.log('Polling attachment handler added!');
}

// Write app.html and index.html
fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', app, 'utf8');
fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html', app, 'utf8');

const finalCheck = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html').equals(fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html'));
console.log('app.html and index.html byte-for-byte identical:', finalCheck);
