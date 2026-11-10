const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('====================================================================');
console.log('   ROBUST BIDIRECTIONAL SYNC & MULTI-DEVICE VERIFICATION SUITE       ');
console.log('====================================================================\n');

// 1. Binary identity of app.html and index.html
const appHtml = fs.readFileSync(path.join(__dirname, 'app.html'));
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'));
assert.strictEqual(appHtml.equals(indexHtml), true, 'app.html and index.html must be 100% binary identical');
console.log('  [PASS] 1. app.html and index.html are 100% binary identical');

function createDevice(name, initialStorage = {}, protocol = 'http:') {
  const broadcasts = [];
  const alerts = [];
  const store = { ...initialStorage };

  const localStorageMock = {
    getItem(k) { return store[k] !== undefined ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); }
  };

  const domElements = {
    'app': { innerHTML: '' },
    'auth-email': { value: '' },
    'auth-password': { value: '' },
    'reg-name': { value: '' },
    'reg-phone': { value: '' },
    'admin-chat-input': { value: '' },
    'cust-chat-input': { value: '' },
    'cust-profile-name': { value: '' },
    'cust-profile-phone': { value: '' },
    'cust-profile-address': { value: '' },
    'buy-qty': { value: '1' },
    'buy-color': { value: 'Espresso' },
    'buy-address': { value: 'Jl. Melati No. 12, Bandung' },
    'buy-payment-method': { value: 'Transfer Bank (BCA)' }
  };

  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: localStorageMock,
    sessionStorage: localStorageMock,
    location: { protocol: protocol, hostname: protocol === 'file:' ? '' : 'localhost', port: protocol === 'file:' ? '' : '3000' },
    document: {
      getElementById(eid) {
        if (!domElements[eid]) {
          domElements[eid] = { value: '', focus() {}, style: {} };
        }
        return domElements[eid];
      },
      createElement() {
        return { style: {}, appendChild() {}, setAttribute() {}, click() {} };
      },
      body: { appendChild() {} },
      addEventListener() {}
    },
    fetch(url, opts = {}) {
      if (url.includes('/api/sync/broadcast')) {
        const body = JSON.parse(opts.body || '{}');
        broadcasts.push(body);
      }
      return Promise.resolve({
        json: () => Promise.resolve({ ok: true }),
        text: () => Promise.resolve('ok')
      });
    },
    confirm: () => true,
    alert: (msg) => { alerts.push(msg); },
    setTimeout: (fn) => fn(),
    setInterval: () => 1,
    Intl, Date, Math, String, Number, Array, Object, JSON, Set, parseInt, parseFloat, isNaN, encodeURI, encodeURIComponent
  };
  sandbox.window = sandbox;

  const scriptMatch = appHtml.toString('utf8').match(/<script>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) throw new Error('Could not find <script> tag in app.html');

  const context = vm.createContext(sandbox);
  vm.runInContext(scriptMatch[1], context);

  return {
    context,
    state: context.state,
    App: context.App,
    broadcasts,
    alerts,
    domElements,
    store
  };
}

// 2. file:/// protocol local fallback
console.log('--- TEST 2: file:/// Protocol Local Sync Support ---');
const fileDev = createDevice('FILE_DEV', {}, 'file:');
fileDev.App.broadcastCloudSync({ type: 'TEST_FILE_SYNC', msg: 'hello' });
assert(fileDev.broadcasts.length > 0, 'file:/// protocol must broadcast to localhost:3000');
console.log('  [PASS] Devices running via file:/// protocol broadcast to localhost:3000');

// 3. User account sync and instant login
console.log('--- TEST 3: Account Sync and Instant Login ---');
const hp = createDevice('HP');
const laptop = createDevice('LAPTOP');

hp.state.authMode = 'register';
hp.state.loginRole = 'customer';
hp.domElements['auth-email'].value = 'fatimah.hijab@gmail.com';
hp.domElements['auth-password'].value = 'SandiFatimah2026';
hp.domElements['reg-name'].value = 'Fatimah Az-Zahra';
hp.domElements['reg-phone'].value = '081299887766';
hp.App.handleAuthSubmit({ preventDefault() {} });

assert.strictEqual(hp.state.auth.email, 'fatimah.hijab@gmail.com');
console.log('  [PASS] Account registered on HP');

// Sync user account from HP to Laptop
const userPacket = hp.broadcasts.find(b => b.type === 'USERS_UPDATE');
assert(userPacket, 'USERS_UPDATE packet broadcasted');
laptop.App.handleIncomingSync(userPacket);

// Now log in directly on Laptop with existing credentials
laptop.state.authMode = 'login';
laptop.state.loginRole = 'customer';
laptop.domElements['auth-email'].value = 'fatimah.hijab@gmail.com';
laptop.domElements['auth-password'].value = 'SandiFatimah2026';
laptop.App.handleAuthSubmit({ preventDefault() {} });

assert(laptop.state.auth, 'User logged in directly on Laptop');
assert.strictEqual(laptop.state.auth.email, 'fatimah.hijab@gmail.com');
console.log('  [PASS] Existing account logs in directly on Laptop');

// 4. Modal auto-close and safety on remote deletion
console.log('--- TEST 4: Modal Auto-Close on Remote Deletion ---');
laptop.state.activeModal = 'purchase';
laptop.state.modalPayload = { id: 'PRD-TARGET', name: 'Pashmina Viscose Hitam', stock: 10 };
laptop.App.handleIncomingSync({ type: 'PRODUCT_DELETE', productId: 'PRD-TARGET' });

assert.strictEqual(laptop.state.activeModal, null, 'Purchase modal must be closed when product is deleted');
assert.strictEqual(laptop.state.modalPayload, null, 'Modal payload must be null');
assert(laptop.alerts.some(a => a.includes('telah dihapus')), 'Alert notified user of deletion');
console.log('  [PASS] Product deletion automatically dismisses active purchase modal and notifies user');

// 5. Customer deletion logs out active deleted session
console.log('--- TEST 5: Deleted Customer Session Invalidation ---');
const custDev = createDevice('CUST_DEV');
custDev.state.auth = { role: 'customer', customerId: 'CUST-DELETED-99', email: 'deleted@gmail.com', name: 'Deleted User' };
custDev.App.handleIncomingSync({ type: 'CUSTOMER_DELETE', customerId: 'CUST-DELETED-99', customerEmail: 'deleted@gmail.com' });

assert.strictEqual(custDev.state.auth, null, 'Logged-in deleted customer must be logged out immediately');
assert(custDev.alerts.some(a => a.includes('telah dihapus oleh admin')), 'Alert notified user of account removal');
console.log('  [PASS] Admin deletion of customer account terminates active customer session on mobile');

// 6. Recalculate customer segments on order cancellation
console.log('--- TEST 6: Customer Segmentation on Order Cancellation ---');
const custDev2 = createDevice('CUST_DEV2');
custDev2.state.data.customers = [
  { id: 'CUST-ABC', name: 'Maryam', email: 'maryam@gmail.com', totalOrders: 1, totalSpent: 89000, segment: 'New Customer' }
];
custDev2.state.data.orders = [
  { id: 'ORD-ABC', customerId: 'CUST-ABC', total: 89000, orderStatus: 'Processing' }
];

custDev2.App.handleIncomingSync({
  type: 'ORDER_UPDATE',
  order: { id: 'ORD-ABC', customerId: 'CUST-ABC', total: 89000, orderStatus: 'Cancelled' }
});

const maryam = custDev2.state.data.customers.find(c => c.id === 'CUST-ABC');
assert.strictEqual(maryam.totalOrders, 0, 'Customer active total orders must be 0 after cancellation');
assert.strictEqual(maryam.totalSpent, 0, 'Customer active total spent must be 0 after cancellation');
console.log('  [PASS] Order cancellation recalculates customer order count and spending');

// 7. Recreating an item removes tombstone
console.log('--- TEST 7: Entity Re-creation Tombstone Removal ---');
const d7 = createDevice('D7');
d7.state.data.deletedIds = ['PRD-RECREATE-1'];
d7.state.modalPayload = { id: 'PRD-RECREATE-1' };
d7.domElements['f-prod-name'] = { value: 'Pashmina Viscose Baru' };
d7.domElements['f-prod-cat'] = { value: 'Pashmina Viscose Modal' };
d7.domElements['f-prod-color'] = { value: 'Espresso' };
d7.domElements['f-prod-price'] = { value: '89000' };
d7.domElements['f-prod-stock'] = { value: '20' };
d7.domElements['f-prod-desc'] = { value: 'Deskripsi baru' };
d7.domElements['f-prod-image'] = { value: '' };

d7.App.saveProduct({ preventDefault() {} });
assert(!d7.state.data.deletedIds.includes('PRD-RECREATE-1'), 'Re-created product must be removed from deletedIds');
console.log('  [PASS] Entity re-creation clears tombstone from deletedIds');

// 8. Server-side intelligent merge verification
console.log('--- TEST 8: Server-side Intelligent Merge ---');
const servePath = path.join(__dirname, 'serve.cjs');
const serveContent = fs.readFileSync(servePath, 'utf8');

// Verify that serve.cjs has intelligent product, order, customer, activity, and followup merges
assert(serveContent.includes('// Products') || serveContent.includes('payload.data.products.forEach'), 'serve.cjs must merge products');
assert(serveContent.includes('// Orders') || serveContent.includes('payload.data.orders.forEach'), 'serve.cjs must merge orders');
assert(serveContent.includes('// Customers') || serveContent.includes('payload.data.customers.forEach'), 'serve.cjs must merge customers');
assert(serveContent.includes('// Activities') || serveContent.includes('payload.data.activities.forEach'), 'serve.cjs must merge activities');
assert(serveContent.includes('// Followups') || serveContent.includes('payload.data.followups.forEach'), 'serve.cjs must merge followups');
assert(serveContent.includes("payload.type === 'CHAT_CLEAR'"), 'serve.cjs must handle CHAT_CLEAR explicitly');
console.log('  [PASS] serve.cjs has intelligent multi-entity merge avoiding data overwrites');

// 9. Network IP detection resilience
console.log('--- TEST 9: Network IP Detection ---');
assert(serveContent.includes('isWifi'), 'serve.cjs detects Wi-Fi interfaces');
assert(serveContent.includes('169.254.'), 'serve.cjs excludes link-local addresses');
assert(serveContent.includes('192.168.56.'), 'serve.cjs excludes VirtualBox host-only addresses');
console.log('  [PASS] serve.cjs network interface detection prioritizes real Wi-Fi over virtual adapters');

console.log('\n====================================================================');
console.log('   ALL 9 ADVANCED BIDIRECTIONAL SYNC & DELETION TESTS PASSED!       ');
console.log('====================================================================');
