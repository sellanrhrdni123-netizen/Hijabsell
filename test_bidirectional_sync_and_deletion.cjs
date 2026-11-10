const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('====================================================================');
console.log('   BIDIRECTIONAL REAL-TIME SYNC & DELETION TEST SUITE              ');
console.log('====================================================================\n');

const appHtmlPath = path.join(__dirname, 'app.html');
const indexHtmlPath = path.join(__dirname, 'index.html');
const appHtml = fs.readFileSync(appHtmlPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// TEST 1: Binary Identity
assert.strictEqual(appHtml, indexHtml, 'app.html and index.html must be 100% binary identical');
console.log('  [PASS] 1. app.html and index.html are 100% binary identical');

// Environment factory to simulate Device A (Laptop) and Device B (HP)
function createSimulatedDevice(id, initialStorage = {}) {
  const localStorageMock = {
    data: { ...initialStorage },
    getItem(key) { return this.data[key] || null; },
    setItem(key, val) { this.data[key] = String(val); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
  };

  const broadcasts = [];
  const renderedViews = [];
  let alerts = [];

  const domElements = {
    'app': { innerHTML: '' },
    'auth-email': { value: '' },
    'auth-password': { value: '' },
    'reg-name': { value: '' },
    'reg-phone': { value: '' }
  };

  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: localStorageMock,
    sessionStorage: localStorageMock,
    location: { protocol: 'http:', hostname: 'localhost', port: '3000' },
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
    fetch(url, opts) {
      if (url.includes('/api/sync/broadcast')) {
        const body = JSON.parse(opts.body);
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
    Intl: Intl,
    Date: Date,
    Math: Math,
    String: String,
    Number: Number,
    Array: Array,
    Object: Object,
    JSON: JSON,
    Set: Set,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    encodeURI: encodeURI,
    encodeURIComponent: encodeURIComponent
  };
  sandbox.window = sandbox;

  // Extract script from appHtml
  const scriptMatch = appHtml.match(/<script>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) throw new Error('Could not find <script> tag in app.html');

  const context = vm.createContext(sandbox);
  vm.runInContext(scriptMatch[1], context);

  // Hook render
  const originalRender = context.render;
  context.render = function() {
    renderedViews.push(context.state ? context.state.view || context.state.customerPortalTab : 'unknown');
    if (originalRender) originalRender();
  };

  return {
    context,
    state: context.state,
    App: context.App,
    broadcasts,
    alerts,
    domElements,
    localStorage: localStorageMock,
    renderedViews
  };
}

// TEST 2: Multi-Device Account Registration & Login Synchronization
console.log('--- TEST 2: Account Registration & Cross-Device Login ---');
const hpDevice = createSimulatedDevice('HP_DEVICE');
const laptopDevice = createSimulatedDevice('LAPTOP_DEVICE');

// Register customer on HP
hpDevice.state.authMode = 'register';
hpDevice.state.loginRole = 'customer';
hpDevice.domElements['auth-email'].value = 'zahra.hijab@gmail.com';
hpDevice.domElements['auth-password'].value = 'SandiZahra123';
hpDevice.domElements['reg-name'].value = 'Zahra Amelia';
hpDevice.domElements['reg-phone'].value = '081233445566';
hpDevice.App.handleAuthSubmit({ preventDefault() {} });

assert.strictEqual(hpDevice.state.auth.email, 'zahra.hijab@gmail.com');
assert.strictEqual(hpDevice.state.auth.role, 'customer');
console.log('  [PASS] Customer registered successfully on HP');

// Check that USERS_UPDATE broadcast was dispatched
const userBroadcast = hpDevice.broadcasts.find(b => b.type === 'USERS_UPDATE');
assert(userBroadcast, 'HP must broadcast USERS_UPDATE packet');
assert(userBroadcast.users['zahra.hijab@gmail.com'], 'Broadcasted users must include zahra');
console.log('  [PASS] HP broadcasted USERS_UPDATE to cloud/network');

// Deliver USERS_UPDATE to Laptop
laptopDevice.App.handleIncomingSync(userBroadcast);
const laptopUsers = laptopDevice.context.getUsers();
assert(laptopUsers['zahra.hijab@gmail.com'], 'Laptop must now have zahra in users dictionary');
assert.strictEqual(laptopUsers['zahra.hijab@gmail.com'].password, 'SandiZahra123');
console.log('  [PASS] Laptop synchronized user account in real-time');

// Now Zahra logs in directly on Laptop!
laptopDevice.state.authMode = 'login';
laptopDevice.state.loginRole = 'customer';
laptopDevice.domElements['auth-email'].value = 'zahra.hijab@gmail.com';
laptopDevice.domElements['auth-password'].value = 'SandiZahra123';
laptopDevice.App.handleAuthSubmit({ preventDefault() {} });

assert(laptopDevice.state.auth, 'Zahra must be logged in on Laptop');
assert.strictEqual(laptopDevice.state.auth.email, 'zahra.hijab@gmail.com');
console.log('  [PASS] Zahra can use her account to log in directly on Laptop without re-registering');

// TEST 3: Pre-existing Customer Database Direct Login (Auto-activation)
console.log('--- TEST 3: Pre-existing Customer Direct Login ---');
const dev3 = createSimulatedDevice('DEV3');
dev3.state.data.customers = [
  { id: 'CUST-EXISTING', name: 'Nabila Member', email: 'nabila@gmail.com', phone: '081999888777', address: 'Bandung' }
];
dev3.state.authMode = 'login';
dev3.state.loginRole = 'customer';
dev3.domElements['auth-email'].value = 'nabila@gmail.com';
dev3.domElements['auth-password'].value = 'NabilaPass2026';
dev3.App.handleAuthSubmit({ preventDefault() {} });

assert(dev3.state.auth, 'Pre-existing customer in database should log in directly');
assert.strictEqual(dev3.state.auth.email, 'nabila@gmail.com');
console.log('  [PASS] Pre-existing CRM customer can log in directly with auto-activated account');

// TEST 4: Product Deletion Synchronization Between Laptop and HP
console.log('--- TEST 4: Product Deletion Real-Time Sync ---');
const laptopStore = createSimulatedDevice('LAPTOP_PROD');
const hpStore = createSimulatedDevice('HP_PROD');

// Add sample product to both
const testProd = {
  id: 'PRD-SYNCCK',
  name: 'Pashmina Viscose Mocha',
  category: 'Pashmina Viscose Modal',
  color: 'Mocha, Black',
  price: 69000,
  stock: 12,
  status: 'Tersedia'
};
laptopStore.state.data.products = [testProd];
hpStore.state.data.products = [testProd];

// Laptop deletes product
laptopStore.App.deleteProduct('PRD-SYNCCK');
assert(!laptopStore.state.data.products.some(p => p.id === 'PRD-SYNCCK'), 'Product deleted locally on Laptop');
assert(laptopStore.state.data.deletedIds.includes('PRD-SYNCCK'), 'Product ID added to deletedIds tombstones on Laptop');

const prodDelBroadcast = laptopStore.broadcasts.find(b => b.type === 'PRODUCT_DELETE' && b.productId === 'PRD-SYNCCK');
assert(prodDelBroadcast, 'Laptop broadcasted PRODUCT_DELETE');

// HP receives product deletion
hpStore.App.handleIncomingSync(prodDelBroadcast);
assert(!hpStore.state.data.products.some(p => p.id === 'PRD-SYNCCK'), 'Product must be automatically deleted on HP');
assert(hpStore.state.data.deletedIds.includes('PRD-SYNCCK'), 'HP must record PRD-SYNCCK in deletedIds');
console.log('  [PASS] Product deleted on Laptop is automatically deleted on HP');

// Verify Ghost Resurrection Prevention:
// Suppose an old sync packet with PRD-SYNCCK arrives at HP:
hpStore.App.handleIncomingSync({
  data: { products: [testProd] }
});
assert(!hpStore.state.data.products.some(p => p.id === 'PRD-SYNCCK'), 'Tombstone MUST prevent resurrecting deleted product');
console.log('  [PASS] Tombstone prevented ghost resurrection of deleted product');

// TEST 5: Order Deletion & Stock Restoration Synchronization
console.log('--- TEST 5: Order Deletion Real-Time Sync ---');
const testOrder = {
  id: 'ORD-TEST-999',
  customerId: 'CUST-001',
  customerName: 'Zahra',
  total: 69000,
  orderStatus: 'Processing',
  items: [{ productId: 'PRD-STOCK-TEST', quantity: 2 }]
};
const baseProd = { id: 'PRD-STOCK-TEST', name: 'Hijab Stock Test', stock: 5, status: 'Stok Menipis' };

laptopStore.state.data.orders = [testOrder];
laptopStore.state.data.products = [{ ...baseProd }];
hpStore.state.data.orders = [testOrder];
hpStore.state.data.products = [{ ...baseProd }];

// Laptop deletes order
laptopStore.App.deleteOrder('ORD-TEST-999');
assert(!laptopStore.state.data.orders.some(o => o.id === 'ORD-TEST-999'), 'Order removed on Laptop');
assert.strictEqual(laptopStore.state.data.products.find(p => p.id === 'PRD-STOCK-TEST').stock, 7, 'Stock restored to 7');

const ordDelBroadcast = laptopStore.broadcasts.find(b => b.type === 'ORDER_DELETE' && b.orderId === 'ORD-TEST-999');
assert(ordDelBroadcast, 'ORDER_DELETE broadcast dispatched');

// HP receives order deletion
hpStore.App.handleIncomingSync(ordDelBroadcast);
assert(!hpStore.state.data.orders.some(o => o.id === 'ORD-TEST-999'), 'Order must be automatically deleted on HP');
assert.strictEqual(hpStore.state.data.products.find(p => p.id === 'PRD-STOCK-TEST').stock, 7, 'HP restored product stock');
console.log('  [PASS] Order deleted on Laptop is automatically deleted on HP with restored stock');

// TEST 6: Customer Deletion Synchronization
console.log('--- TEST 6: Customer Deletion Real-Time Sync ---');
const testCust = { id: 'CUST-DEL-1', name: 'Pelanggan Hapus', email: 'del@gmail.com' };
laptopStore.state.data.customers = [testCust];
hpStore.state.data.customers = [testCust];

laptopStore.App.deleteCustomer('CUST-DEL-1');
assert(!laptopStore.state.data.customers.some(c => c.id === 'CUST-DEL-1'));

const custDelBroadcast = laptopStore.broadcasts.find(b => b.type === 'CUSTOMER_DELETE' && b.customerId === 'CUST-DEL-1');
assert(custDelBroadcast, 'CUSTOMER_DELETE broadcast dispatched');

hpStore.App.handleIncomingSync(custDelBroadcast);
assert(!hpStore.state.data.customers.some(c => c.id === 'CUST-DEL-1'), 'Customer deleted automatically on HP');
console.log('  [PASS] Customer deleted on Laptop is automatically deleted on HP');

// TEST 7: Followup Deletion Synchronization
console.log('--- TEST 7: Follow-up Deletion Real-Time Sync ---');
const testFlw = { id: 'FLW-DEL-1', customerName: 'Zahra', status: 'Belum Dihubungi' };
laptopStore.state.data.followups = [testFlw];
hpStore.state.data.followups = [testFlw];

laptopStore.App.deleteFollowup('FLW-DEL-1');
assert(!laptopStore.state.data.followups.some(f => f.id === 'FLW-DEL-1'));

const flwDelBroadcast = laptopStore.broadcasts.find(b => b.type === 'FOLLOWUP_DELETE' && b.followupId === 'FLW-DEL-1');
assert(flwDelBroadcast, 'FOLLOWUP_DELETE broadcast dispatched');

hpStore.App.handleIncomingSync(flwDelBroadcast);
assert(!hpStore.state.data.followups.some(f => f.id === 'FLW-DEL-1'), 'Followup deleted automatically on HP');
console.log('  [PASS] Follow-up deleted on Laptop is automatically deleted on HP');

// TEST 8: Chat Clear Synchronization
console.log('--- TEST 8: Chat Clear Real-Time Sync ---');
const chatMsgs = [
  { id: 'M-1', customerId: 'CUST-001', sender: 'customer', text: 'Halo min' },
  { id: 'M-2', customerId: 'CUST-001', sender: 'admin', text: 'Halo sis' }
];
laptopStore.state.chats = [...chatMsgs];
hpStore.state.chats = [...chatMsgs];

laptopStore.App.clearAdminChat('CUST-001');
assert.strictEqual(laptopStore.state.chats.length, 0);

const chatClearBroadcast = laptopStore.broadcasts.find(b => b.type === 'CHAT_CLEAR');
assert(chatClearBroadcast, 'CHAT_CLEAR broadcast dispatched');

hpStore.App.handleIncomingSync(chatClearBroadcast);
assert.strictEqual(hpStore.state.chats.length, 0, 'HP chats cleared');
console.log('  [PASS] Chat history cleared on Laptop is automatically cleared on HP');

// TEST 9: Empty State Reset Synchronization
console.log('--- TEST 9: Empty State Reset Real-Time Sync ---');
hpStore.state.data.products = [{ id: 'P-RESTORE', name: 'Hijab' }];
laptopStore.App.resetEmptyState();

const resetBroadcast = laptopStore.broadcasts.find(b => b.type === 'RESET_EMPTY_STATE');
assert(resetBroadcast, 'RESET_EMPTY_STATE broadcast dispatched');

hpStore.App.handleIncomingSync(resetBroadcast);
assert.strictEqual(hpStore.state.data.products.length, 0);
assert.strictEqual(hpStore.state.data.orders.length, 0);
assert.strictEqual(hpStore.state.data.customers.length, 0);
console.log('  [PASS] Empty State Reset on Laptop is automatically reflected on HP');

console.log('\n====================================================================');
console.log('   ALL BIDIRECTIONAL SYNC & DELETION TESTS PASSED 100%!             ');
console.log('====================================================================');
