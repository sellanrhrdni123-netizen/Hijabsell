const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appHtml = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

console.log('--- TEST REQUIREMENT 1: No Ke Portal in admin sidebar/dashboard ---');
if (appHtml.includes('Ke Portal') || indexHtml.includes('Ke Portal')) {
  throw new Error('Found Ke Portal in HTML!');
}
console.log('PASSED: Neither app.html nor index.html contains Ke Portal');

console.log('--- TEST REQUIREMENT 2: Zero Dummy Data on Initial State ---');
const scriptMatch = appHtml.match(/<script>([\s\S]*?)<\/script>/);
const scriptCode = scriptMatch[1];

function createEnv(storage = {}) {
  const store = { ...storage };
  const elements = {};
  let lastAlert = null;
  const mockDoc = {
    getElementById: (id) => elements[id] || (elements[id] = { id, value: '', style: {} }),
    createElement: (tag) => ({ tag, click() {}, setAttribute() {}, style: {} })
  };
  elements['app'] = { innerHTML: '' };
  const mockLocalStorage = {
    getItem: (k) => store[k] !== undefined ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
  const sandbox = {
    window: {},
    document: mockDoc,
    localStorage: mockLocalStorage,
    alert: (msg) => { lastAlert = msg; },
    confirm: () => true,
    console,
    Date, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isNaN, encodeURI, encodeURIComponent
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);
  return { sandbox, getLastAlert: () => lastAlert, store, elements };
}

const envClean = createEnv({});
if (envClean.sandbox.state.data.customers.length !== 0) throw new Error('Initial customers not 0');
if (envClean.sandbox.state.data.products.length !== 0) throw new Error('Initial products not 0');
if (envClean.sandbox.state.data.orders.length !== 0) throw new Error('Initial orders not 0');
if (envClean.sandbox.state.data.followups.length !== 0) throw new Error('Initial followups not 0');
if (envClean.sandbox.state.data.activities.length !== 0) throw new Error('Initial activities not 0');
console.log('PASSED: Clean initial state verified (all 0 items)');

console.log('--- TEST REQUIREMENT 3: Reject Customer Order If Color Not in Etalase ---');
const testProd = {
  id: 'PRD-TEST',
  name: 'Pashmina Viscose Modal',
  category: 'Pashmina Viscose Modal',
  color: 'Espresso, Mauve Taupe, Soft Sand',
  price: 89000,
  stock: 10,
  status: 'Tersedia'
};

const custEnv = createEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'buyer@gmail.com', name: 'Buyer Test', customerId: 'CUST-BUYER' }),
  'by_nvdila_data_v2': JSON.stringify({
    customers: [{ id: 'CUST-BUYER', name: 'Buyer Test', email: 'buyer@gmail.com', phone: '081234567890', address: 'Jl. Test No 1', segment: 'New Customer' }],
    products: [testProd],
    orders: [],
    followups: [],
    activities: []
  })
});

// Test 3a: Reject color not in etalase (e.g. 'Neon Green')
custEnv.sandbox.App.openPurchase('PRD-TEST');
custEnv.sandbox.document.getElementById('buy-color').value = 'Neon Green';
custEnv.sandbox.document.getElementById('buy-qty').value = 1;
custEnv.sandbox.App.submitPurchase({ preventDefault() {} });
if (custEnv.getLastAlert() !== 'warna tidak tersedia/habis') {
  throw new Error('Expected alert warna tidak tersedia/habis but got: ' + custEnv.getLastAlert());
}
if (custEnv.sandbox.state.data.orders.length !== 0) {
  throw new Error('Order should NOT be created for invalid color');
}
console.log('PASSED: Order with unlisted color Neon Green rejected with warna tidak tersedia/habis');

// Test 3b: Reject empty color
custEnv.sandbox.document.getElementById('buy-color').value = '';
custEnv.sandbox.App.submitPurchase({ preventDefault() {} });
if (custEnv.getLastAlert() !== 'warna tidak tersedia/habis') {
  throw new Error('Expected alert for empty color');
}
if (custEnv.sandbox.state.data.orders.length !== 0) {
  throw new Error('Order should NOT be created for empty color');
}
console.log('PASSED: Empty color rejected');

// Test 3c: Accept valid color in etalase ('Espresso')
custEnv.sandbox.document.getElementById('buy-color').value = 'Espresso';
custEnv.sandbox.document.getElementById('buy-qty').value = 1;
custEnv.sandbox.document.getElementById('buy-address').value = 'Jl. Melati No. 14, Menteng, Jakarta Pusat';
custEnv.sandbox.App.submitPurchase({ preventDefault() {} });
if (custEnv.sandbox.state.data.orders.length !== 1) {
  throw new Error('Order should be created for valid color');
}
if (custEnv.sandbox.state.data.orders[0].items[0].color !== 'Espresso') {
  throw new Error('Order item color mismatch');
}
if (custEnv.sandbox.state.data.products[0].stock !== 9) {
  throw new Error('Stock not decremented');
}
console.log('PASSED: Valid color Espresso accepted, stock decremented');

console.log('--- TEST REQUIREMENT 4: No Status Member Card on Customer Dashboard Grid (Only at Top) ---');
const customerPortalJsx = fs.readFileSync(path.join(__dirname, 'src', 'components', 'CustomerPortal.jsx'), 'utf8');

// Check that appHtml and index.html are identical
if (appHtml !== indexHtml) {
  throw new Error('app.html and index.html must be 100% identical');
}

// In customer portal home view, KPI grid should be grid-3 without Status Member card
if (appHtml.includes('<div class="grid grid-4">\n                  <div class="card card-clickable" onclick="App.handleCustomerStatClick(\'member\')')) {
  throw new Error('Customer dashboard still contains Status Member card in grid-4');
}

// Ensure grid-3 is present for remaining quick cards
if (!appHtml.includes('<div class="grid grid-3">')) {
  throw new Error('Customer dashboard should use grid-3 for quick cards');
}

// Ensure status member is present at the top (header / banner)
if (!appHtml.includes('Tingkat Member:') || !appHtml.includes('👑 ${escapeHtml(segment)}')) {
  throw new Error('Customer portal should display member status in the top area');
}

// In CustomerPortal.jsx, verify member status is displayed at the top and removed from dashboard quick cards
if (!customerPortalJsx.includes('Member Status:')) {
  throw new Error('CustomerPortal.jsx should display Member Status at the top');
}
console.log('PASSED: Status member card removed from customer dashboard grid, only displayed in top area');

console.log('--- TEST REQUIREMENT 5: Customer Order Cancellation & Complete Dummy Data Removal ---');
// Verify cancel button in HTML and JSX
if (!appHtml.includes('App.cancelCustomerOrder')) {
  throw new Error('app.html must include App.cancelCustomerOrder');
}
if (!appHtml.includes('Batalkan Pesanan')) {
  throw new Error('app.html must include Batalkan Pesanan button');
}
if (!customerPortalJsx.includes('Batalkan Pesanan')) {
  throw new Error('CustomerPortal.jsx must include Batalkan Pesanan button');
}

// Test order cancellation simulation
const orderToCancel = custEnv.sandbox.state.data.orders[0];
const initialStockBeforeCancel = custEnv.sandbox.state.data.products[0].stock; // 9
custEnv.sandbox.App.cancelCustomerOrder(orderToCancel.id);
if (custEnv.sandbox.state.data.orders[0].orderStatus !== 'Cancelled') {
  throw new Error('Order status should be Cancelled');
}
if (custEnv.sandbox.state.data.products[0].stock !== initialStockBeforeCancel + 1) {
  throw new Error('Product stock should be restored after cancellation');
}
if (!custEnv.getLastAlert().includes('berhasil dibatalkan')) {
  throw new Error('Expected cancellation success alert');
}
console.log('PASSED: Order successfully cancelled, product stock restored to 10');

// Test Shipped order cannot be cancelled
custEnv.sandbox.state.data.orders.push({
  id: 'ORD-SHIPPED',
  customerId: 'CUST-BUYER',
  orderStatus: 'Shipped',
  items: [{ productId: 'PRD-TEST', quantity: 1 }]
});
custEnv.sandbox.App.cancelCustomerOrder('ORD-SHIPPED');
if (custEnv.getLastAlert() !== 'Pesanan sudah dalam proses pengiriman dan tidak dapat dibatalkan.') {
  throw new Error('Expected shipped rejection alert');
}
console.log('PASSED: Shipped order cancellation rejected');

// Test Dummy Data Purge from localStorage
const envWithDummyStorage = createEnv({
  'by_nvdila_data_v2': JSON.stringify({
    customers: [{ id: 'CUST-001', name: 'Zahra Amelia Putri' }],
    products: [{ id: 'PRD-001', name: 'Pashmina Viscose Modal Premium by.nvdila' }],
    orders: [],
    followups: [],
    activities: []
  })
});
if (envWithDummyStorage.sandbox.state.data.customers.length !== 0 || envWithDummyStorage.sandbox.state.data.products.length !== 0) {
  throw new Error('Dummy data from localStorage should be automatically purged');
}
console.log('PASSED: Dummy data from localStorage automatically purged to clean empty state');

console.log('--- TEST REQUIREMENT 6: Login Rejection For Unregistered Users ---');
const loginEnv = createEnv({});
loginEnv.sandbox.state.authMode = 'login';
loginEnv.sandbox.state.loginRole = 'customer';
loginEnv.sandbox.document.getElementById('auth-email').value = 'unregistered.user@gmail.com';
loginEnv.sandbox.document.getElementById('auth-password').value = 'Secret123';
loginEnv.sandbox.App.handleAuthSubmit({ preventDefault() {} });
if (loginEnv.sandbox.state.auth !== null) {
  throw new Error('Unregistered user should NOT be logged in!');
}
if (!loginEnv.getLastAlert().includes('Akun belum terdaftar')) {
  throw new Error('Expected alert Akun belum terdaftar, got: ' + loginEnv.getLastAlert());
}
if (loginEnv.sandbox.state.authMode !== 'register') {
  throw new Error('Should switch to register mode on unregistered login attempt');
}
console.log('PASSED: Unregistered user rejected with prompt to register first');

console.log('--- TEST REQUIREMENT 7: Mandatory Shipping Address on Purchase ---');
custEnv.sandbox.App.openPurchase('PRD-TEST');
custEnv.sandbox.document.getElementById('buy-color').value = 'Espresso';
custEnv.sandbox.document.getElementById('buy-qty').value = 1;
custEnv.sandbox.document.getElementById('buy-address').value = ''; // Empty address
custEnv.sandbox.App.submitPurchase({ preventDefault() {} });
if (!custEnv.getLastAlert().includes('Wajib mengisi alamat pengiriman')) {
  throw new Error('Expected alert Wajib mengisi alamat pengiriman, got: ' + custEnv.getLastAlert());
}
console.log('PASSED: Empty address rejected with mandatory address notification');

// Now provide valid address
custEnv.sandbox.document.getElementById('buy-address').value = 'Jl. Anggrek No. 12, Menteng, Jakarta Pusat';
custEnv.sandbox.App.submitPurchase({ preventDefault() {} });
const lastOrder = custEnv.sandbox.state.data.orders[0];
if (!lastOrder || lastOrder.shippingAddress !== 'Jl. Anggrek No. 12, Menteng, Jakarta Pusat') {
  throw new Error('Valid order with address should be saved');
}
console.log('PASSED: Valid purchase with shipping address accepted');

console.log('\n====================================================');
console.log('   ALL 7 USER REQUIREMENTS VERIFIED AND CONFIRMED!  ');
console.log('====================================================');
