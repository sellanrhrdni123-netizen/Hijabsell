const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appHtmlPath = path.join(__dirname, 'app.html');
const appHtml = fs.readFileSync(appHtmlPath, 'utf8');

console.log('====================================================');
console.log('   COMPREHENSIVE TEST SUITE FOR BY.NVDILA           ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}: ${details}`);
    throw new Error(`Assertion failed: ${testName} - ${details}`);
  }
}

// 1. AST / SYNTAX INTEGRITY
console.log('--- 1. Script Extraction & Compilation ---');
const scriptMatch = appHtml.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch !== null, 'Found <script> block in app.html');
const scriptCode = scriptMatch[1];

let compiledFn;
try {
  compiledFn = new Function(scriptCode);
  assert(true, 'JavaScript in <script> compiles without syntax errors');
} catch (e) {
  assert(false, 'JavaScript compilation', e.message);
}

// 2. BRANDING & OFFLINE AUDIT
console.log('\n--- 2. Branding & Offline Audit ---');
assert(!appHtml.includes('<title>CRM'), 'Title does not contain "CRM"');
assert(!appHtml.includes('by.nvdila CRM'), 'Brand does not contain "CRM"');
assert(!/by\.nvdila\s+crm/i.test(appHtml), 'No occurrence of "by.nvdila CRM"');

const externalCdns = ['unpkg.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'cdn.tailwindcss.com'];
for (const cdn of externalCdns) {
  assert(!appHtml.includes(cdn), `No external CDN: ${cdn}`);
}

// 3. SIMULATED BROWSER ENVIRONMENT EXECUTION
console.log('\n--- 3. Interactive Execution Simulation ---');

// Create mock DOM environment
function createMockEnv(initialLocalStorage = {}) {
  const store = { ...initialLocalStorage };
  const elements = {};
  let alertMessages = [];
  let confirms = [];

  const mockDoc = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          value: '',
          type: 'text',
          innerHTML: '',
          selectionStart: 0,
          selectionEnd: 0,
          focus() {},
          setSelectionRange(s, e) { this.selectionStart = s; this.selectionEnd = e; }
        };
      }
      return elements[id];
    },
    createElement(tag) {
      return { tag, click() {}, setAttribute() {}, style: {} };
    }
  };

  const appEl = { innerHTML: '' };
  elements['app'] = appEl;

  const mockLocalStorage = {
    getItem(k) { return store[k] !== undefined ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); }
  };

  const mockWindow = {
    location: { href: 'file:///app.html' },
    localStorage: mockLocalStorage,
    document: mockDoc,
    alert(msg) { alertMessages.push(msg); },
    confirm(msg) { confirms.push(msg); return true; },
    print() {},
    onload: null
  };

  const sandbox = {
    window: mockWindow,
    document: mockDoc,
    localStorage: mockLocalStorage,
    alert: mockWindow.alert,
    confirm: mockWindow.confirm,
    console: console,
    Intl: Intl,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    encodeURI: encodeURI,
    encodeURIComponent: encodeURIComponent,
    RegExp: RegExp
  };

  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);

  sandbox.state = sandbox.window.state;
  sandbox.App = sandbox.window.App;

  return { sandbox, elements, store, alertMessages, confirms };
}

// Test A: Initial clean load (no auth)
const env1 = createMockEnv();
assert(env1.sandbox.state.auth === null, 'Initial auth is null');
assert(env1.elements['app'].innerHTML.includes('Masuk'), 'Auth screen renders login options');
assert(!env1.elements['app'].innerHTML.includes('Akses Admin Khusus'), 'Admin announcement banner is removed from login screen');
assert(!env1.elements['app'].innerHTML.includes('sellanrhrdni123@gmail.com'), 'Admin email is NOT displayed on login screen');
assert(env1.sandbox.state.tempEmail === '' && env1.sandbox.state.tempPassword === '', 'Login inputs remain clean and empty on initial load');

// Test B: Attempt to select Admin role with unauthorized email in field
const env2 = createMockEnv();
env2.sandbox.document.getElementById('auth-email').value = 'budi@gmail.com';
env2.sandbox.App.setLoginRole('admin');
assert(env2.alertMessages.length === 1, 'Alert triggered on unauthorized Admin role selection');
assert(env2.alertMessages[0].includes('Tidak dapat masuk'), 'Alert message indicates cannot log in');
assert(!env2.alertMessages[0].includes('sellanrhrdni123@gmail.com'), 'Alert message does not expose admin email');
assert(env2.sandbox.state.authError !== null, 'authError set in state on select');

// Test C: Attempt to login as Admin with unauthorized email
const env3 = createMockEnv();
env3.sandbox.state.loginRole = 'admin';
env3.sandbox.document.getElementById('auth-email').value = 'attacker@evil.com';
env3.sandbox.App.handleAuthSubmit({ preventDefault() {} });
assert(env3.alertMessages.length === 1, 'Alert triggered on unauthorized Admin login attempt');
assert(env3.sandbox.state.auth === null, 'Auth remains null on rejected login');

// Test D: Attempt to register as Admin with unauthorized email
const env4 = createMockEnv();
env4.sandbox.App.setAuthMode('register');
env4.sandbox.state.loginRole = 'admin';
env4.sandbox.document.getElementById('auth-email').value = 'attacker2@evil.com';
env4.sandbox.App.handleAuthSubmit({ preventDefault() {} });
assert(env4.alertMessages.length === 1, 'Alert triggered on unauthorized Admin register attempt');
assert(env4.sandbox.state.auth === null, 'Auth remains null on rejected register');

// Test E: Legitimate Admin login with sellanrhrdni123@gmail.com
const env5 = createMockEnv();
env5.sandbox.state.loginRole = 'admin';
env5.sandbox.document.getElementById('auth-email').value = 'sellanrhrdni123@gmail.com';
env5.sandbox.App.handleAuthSubmit({ preventDefault() {} });
assert(env5.sandbox.state.auth !== null, 'Admin successfully logged in');
assert(env5.sandbox.state.auth.role === 'admin', 'Auth role is admin');
assert(env5.sandbox.state.auth.email === 'sellanrhrdni123@gmail.com', 'Auth email matches');
assert(env5.sandbox.state.view === 'dashboard', 'Redirected to dashboard');
assert(env5.store['by_nvdila_auth_v2'] !== undefined, 'Admin session saved to localStorage');

// Test F: Sella logs in even when role selector was 'customer'
const env6 = createMockEnv();
env6.sandbox.state.loginRole = 'customer';
env6.sandbox.document.getElementById('auth-email').value = 'sellanrhrdni123@gmail.com';
env6.sandbox.App.handleAuthSubmit({ preventDefault() {} });
assert(env6.sandbox.state.auth !== null, 'Sella recognized under customer tab');
assert(env6.sandbox.state.auth.role === 'admin', 'Sella immediately elevated to admin');
assert(env6.sandbox.state.view === 'dashboard', 'Sella redirected to admin dashboard');

// Test G: Customer logs in
const env7 = createMockEnv();
env7.sandbox.state.loginRole = 'customer';
env7.sandbox.document.getElementById('auth-email').value = 'pelanggan.loyal@gmail.com';
env7.sandbox.document.getElementById('reg-name').value = 'Pelanggan Setia';
env7.sandbox.App.handleAuthSubmit({ preventDefault() {} });
assert(env7.sandbox.state.auth !== null, 'Customer logged in');
assert(env7.sandbox.state.auth.role === 'customer', 'Role is customer');
assert(env7.sandbox.state.customerPortalTab === 'home', 'Portal home view active');
assert(env7.elements['app'].innerHTML.includes('Portal Pelanggan'), 'Portal view rendered');

// Customer attempts switchToAdmin -> rejected!
env7.sandbox.App.switchToAdmin();
assert(env7.alertMessages.length === 1, 'Alert triggered when customer calls switchToAdmin');
assert(env7.sandbox.state.auth.role === 'customer', 'Customer role not elevated');

// Test H: Sella in Customer Portal switches to Admin
const env8 = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella' })
});
assert(env8.sandbox.state.auth !== null, 'Session persisted from localStorage');
env8.sandbox.App.switchToPortal();
assert(env8.sandbox.state.auth.role === 'customer', 'Switched to customer portal');
env8.sandbox.App.switchToAdmin();
assert(env8.sandbox.state.auth.role === 'admin', 'Switched back to admin panel');

// Test I: Illegitimate admin in localStorage is evicted on load
const env9 = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'hacker@admin.com', name: 'Hacker' })
});
assert(env9.sandbox.state.auth === null, 'Illegitimate admin session evicted');
assert(env9.store['by_nvdila_auth_v2'] === undefined, 'Illegitimate session removed from localStorage');

// Test J: Password toggle does NOT wipe form inputs
const env10 = createMockEnv();
env10.sandbox.document.getElementById('auth-email').value = 'test@example.com';
env10.sandbox.document.getElementById('auth-password').value = 'customSecretPass123';
env10.sandbox.App.togglePassword();
assert(env10.sandbox.document.getElementById('auth-password').type === 'text', 'Password field type toggled to text');
assert(env10.sandbox.document.getElementById('auth-password').value === 'customSecretPass123', 'Password value preserved');
assert(env10.sandbox.document.getElementById('auth-email').value === 'test@example.com', 'Email value preserved');

// Test K: Navigation tabs in Admin
const adminEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella Nurhardiani' })
});
const views = ['dashboard', 'customers', 'products', 'orders', 'chat', 'insight', 'followup', 'reports', 'settings'];
for (const v of views) {
  adminEnv.sandbox.App.setView(v);
  assert(adminEnv.sandbox.state.view === v, `Navigated to ${v}`);
  assert(adminEnv.elements['app'].innerHTML.length > 500, `View ${v} rendered non-empty content`);
}

// Test L: Customer Detail Navigation with Special Quotes in Name
const testCust = {
  id: 'CUST-QUOTE',
  name: "Zahra Syafi'i",
  phone: '0812999888',
  email: 'zahra.syafii@gmail.com',
  joinDate: '2026-02-01',
  segment: 'Loyal Customer',
  status: 'Aktif',
  notes: 'Suka warna "Soft Sand"'
};
adminEnv.sandbox.state.data.customers.push(testCust);
adminEnv.sandbox.App.viewCustomer('CUST-QUOTE');
assert(adminEnv.sandbox.state.selectedCustomerId === 'CUST-QUOTE', 'Customer detail loaded');
assert(adminEnv.elements['app'].innerHTML.includes("Zahra Syafi&#39;i") || adminEnv.elements['app'].innerHTML.includes("Zahra Syafi'i"), 'Customer name safely rendered');

// Test openAddOrderForCustomer without quote-injection crash
adminEnv.sandbox.App.openAddOrderForCustomer('CUST-QUOTE');
assert(adminEnv.sandbox.state.activeModal === 'order', 'Order modal opened for customer with quote in name');
assert(adminEnv.sandbox.state.modalPayload.customerName === "Zahra Syafi'i", 'Payload matches customer');
adminEnv.sandbox.App.closeModal();

// Test M: Orders Search and Filtering
adminEnv.sandbox.App.setView('orders');
adminEnv.sandbox.App.handleOrderSearch('SPXID');
assert(adminEnv.sandbox.state.orderSearch === 'SPXID', 'Order search set');
adminEnv.sandbox.App.handleOrderStatusFilter('Processing');
assert(adminEnv.sandbox.state.orderFilterStatus === 'Processing', 'Order status filter set');
assert(!adminEnv.elements['app'].innerHTML.includes('id="ord-channel-filter"'), 'Order channel filter dropdown is removed');
assert(!adminEnv.elements['app'].innerHTML.includes('Semua Saluran'), 'Order channel options removed');
adminEnv.sandbox.App.handleOrderSearch('');
adminEnv.sandbox.App.handleOrderStatusFilter('ALL');

// Test N: Order Status Interactive Update
const sampleOrder = {
  id: 'ORD-SAMPLE-001',
  customerId: 'CUST-QUOTE',
  customerName: "Zahra Syafi'i",
  date: '2026-03-01',
  total: 89000,
  orderStatus: 'Processing',
  items: []
};
adminEnv.sandbox.state.data.orders.push(sampleOrder);
const sampleOrderId = sampleOrder.id;
adminEnv.sandbox.App.updateOrderStatus(sampleOrderId, 'Completed');
assert(adminEnv.sandbox.state.data.orders.find(o => o.id === sampleOrderId).orderStatus === 'Completed', 'Order status updated to Completed');

// Test O: Customer Portal "Beli Sekarang" and Stock Handling
const custEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'citra@bynvdila.com', name: 'Citra', customerId: 'CUST-CITRA' })
});
custEnv.sandbox.state.data.products.push({
  id: 'PRD-CITRA-001',
  name: 'Pashmina Viscose Modal Premium',
  category: 'Pashmina Viscose Modal',
  price: 89000,
  stock: 10,
  color: 'Espresso',
  status: 'Tersedia'
});
custEnv.sandbox.App.setPortalTab('catalog');
const productToBuy = custEnv.sandbox.state.data.products[0];
const initialStock = productToBuy.stock;

custEnv.sandbox.App.openPurchase(productToBuy.id);
assert(custEnv.sandbox.state.activeModal === 'purchase', 'Purchase checkout modal opened');
custEnv.sandbox.document.getElementById('buy-qty').value = 3;
custEnv.sandbox.document.getElementById('buy-color').value = 'Espresso';
custEnv.sandbox.document.getElementById('buy-address').value = 'Jl. Citra No. 10, Jakarta';
custEnv.sandbox.App.submitPurchase({ preventDefault() {} });

assert(custEnv.sandbox.state.activeModal === null, 'Modal dismissed after purchase');
const updatedProd = custEnv.sandbox.state.data.products.find(p => p.id === productToBuy.id);
assert(updatedProd.stock === initialStock - 3, 'Product stock decremented by 3');
assert(custEnv.sandbox.state.data.orders.length > 0, 'New order recorded in database');
const latestOrder = custEnv.sandbox.state.data.orders[0];
assert(latestOrder.qty === 3, 'Order quantity is 3');
assert(latestOrder.orderStatus === 'Processing', 'Order status is Processing');
assert(latestOrder.paymentStatus === 'Lunas', 'Order paymentStatus is Lunas');

// Test P: Reset Empty State and Reload Sample Data
adminEnv.sandbox.App.setView('settings');
adminEnv.sandbox.App.resetEmptyState();
assert(adminEnv.sandbox.state.data.customers.length === 0, 'Customers reset to 0');
assert(adminEnv.sandbox.state.data.products.length === 0, 'Products reset to 0');
assert(adminEnv.sandbox.state.data.orders.length === 0, 'Orders reset to 0');

adminEnv.sandbox.App.setView('dashboard');
assert(adminEnv.elements['app'].innerHTML.includes('Belum ada pesanan'), 'Dashboard displays empty state');

adminEnv.sandbox.App.loadSampleData();
assert(adminEnv.sandbox.state.data.customers.length > 0, 'Sample customers reloaded');
assert(adminEnv.sandbox.state.data.products.length > 0, 'Sample products reloaded');
assert(adminEnv.sandbox.state.data.orders.length > 0, 'Sample orders reloaded');

// Test Q: Clean Settings View Verification (Requirement 2)
adminEnv.sandbox.App.setView('settings');
assert(!adminEnv.elements['app'].innerHTML.includes('Muat Data Sampel Uji'), 'Settings view does NOT display "Muat Data Sampel Uji" button');
assert(!adminEnv.elements['app'].innerHTML.includes('Reset ke Data Kosong'), 'Settings view does NOT display "Reset ke Data Kosong" button');
assert(adminEnv.elements['app'].innerHTML.includes('Profil Brand &amp; Koleksi Hijab') || adminEnv.elements['app'].innerHTML.includes('Profil Brand & Koleksi Hijab'), 'Settings view displays Brand Profile');
assert(adminEnv.elements['app'].innerHTML.includes('Informasi Sistem &amp; Keamanan') || adminEnv.elements['app'].innerHTML.includes('Informasi Sistem & Keamanan'), 'Settings view displays System Information');

// Test R: Back Button with Icon (Requirement 3)
const firstCust = adminEnv.sandbox.state.data.customers[0];
adminEnv.sandbox.App.viewCustomer(firstCust.id);
assert(adminEnv.sandbox.state.selectedCustomerId === firstCust.id, 'Customer detail view loaded');
assert(adminEnv.elements['app'].innerHTML.includes('←') && adminEnv.elements['app'].innerHTML.includes('Kembali ke Daftar Pelanggan'), 'Customer detail contains back button with icon');
adminEnv.sandbox.App.backToCustomerList();
assert(adminEnv.sandbox.state.selectedCustomerId === null, 'Back button returns cleanly to customer list');

// Test S: Consistent Password Authentication (Requirement 7)
const pwdEnv = createMockEnv();
pwdEnv.sandbox.App.setAuthMode('register');
pwdEnv.sandbox.state.loginRole = 'customer';
pwdEnv.sandbox.document.getElementById('auth-email').value = 'member.setia@bynvdila.com';
pwdEnv.sandbox.document.getElementById('auth-password').value = 'RahasiaHijab123';
pwdEnv.sandbox.document.getElementById('reg-name').value = 'Member Setia';
pwdEnv.sandbox.document.getElementById('reg-phone').value = '081299887766';
pwdEnv.sandbox.App.handleAuthSubmit({ preventDefault() {} });

assert(pwdEnv.sandbox.state.auth !== null, 'Member registered successfully');
const storedUsers = JSON.parse(pwdEnv.store['by_nvdila_users_v2'] || '{}');
assert(storedUsers['member.setia@bynvdila.com'] !== undefined, 'User credentials saved to by_nvdila_users_v2');
assert(storedUsers['member.setia@bynvdila.com'].password === 'RahasiaHijab123', 'Password accurately stored in by_nvdila_users_v2');

// Logout member
pwdEnv.sandbox.App.logout();
assert(pwdEnv.sandbox.state.auth === null, 'User logged out successfully');

// Attempt login with wrong password
pwdEnv.sandbox.App.setAuthMode('login');
pwdEnv.sandbox.state.loginRole = 'customer';
pwdEnv.sandbox.document.getElementById('auth-email').value = 'member.setia@bynvdila.com';
pwdEnv.sandbox.document.getElementById('auth-password').value = 'SalahPasswordTotal!';
pwdEnv.sandbox.App.handleAuthSubmit({ preventDefault() {} });

assert(pwdEnv.alertMessages.some(m => m.includes('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.')), 'Rejection alert triggered on incorrect password');
assert(pwdEnv.sandbox.state.auth === null, 'Access denied on incorrect password');

// Attempt login with correct original password
pwdEnv.sandbox.document.getElementById('auth-password').value = 'RahasiaHijab123';
pwdEnv.sandbox.App.handleAuthSubmit({ preventDefault() {} });
assert(pwdEnv.sandbox.state.auth !== null, 'Access granted with correct original password');
assert(pwdEnv.sandbox.state.auth.email === 'member.setia@bynvdila.com', 'Authenticated session matches customer');

// Test T: Product Photo Feature (File-Only Upload, Link Removed)
adminEnv.sandbox.App.openAddProduct();
assert(adminEnv.sandbox.state.activeModal === 'product', 'Product add modal opened');
assert(!adminEnv.elements['app'].innerHTML.includes('placeholder="URL Foto Gambar'), 'Product photo link input is removed from modal');

// Simulate photo upload from local file
adminEnv.sandbox.state.tempProductImage = 'data:image/jpeg;base64,sampleBase64ProductPhoto';
adminEnv.sandbox.document.getElementById('f-prod-name').value = 'Pashmina Viscose Silk Special';
adminEnv.sandbox.document.getElementById('f-prod-cat').value = 'Pashmina Viscose Modal';
adminEnv.sandbox.document.getElementById('f-prod-color').value = 'Rose Gold, Pearl';
adminEnv.sandbox.document.getElementById('f-prod-price').value = 110000;
adminEnv.sandbox.document.getElementById('f-prod-stock').value = 15;
adminEnv.sandbox.document.getElementById('f-prod-desc').value = 'Viscose silk adem premium flowy';
adminEnv.sandbox.App.saveProduct({ preventDefault() {} });

const addedProd = adminEnv.sandbox.state.data.products.find(p => p.name === 'Pashmina Viscose Silk Special');
assert(addedProd !== undefined, 'New product with photo created');
assert(addedProd.image === 'data:image/jpeg;base64,sampleBase64ProductPhoto', 'Product image saved accurately from file upload');

adminEnv.sandbox.App.setView('products');
assert(adminEnv.elements['app'].innerHTML.includes('data:image/jpeg;base64,sampleBase64ProductPhoto'), 'Product photo rendered on product card in admin');

// Customer catalog also renders photo
const portalEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'member.setia@bynvdila.com', name: 'Member Setia' }),
  'by_nvdila_data_v2': JSON.stringify(adminEnv.sandbox.state.data)
});
portalEnv.sandbox.App.setPortalTab('catalog');
assert(portalEnv.elements['app'].innerHTML.includes('data:image/jpeg;base64,sampleBase64ProductPhoto'), 'Product photo rendered on Customer Portal catalog');

// Test U: Shipping Address and Payment Methods (Requirement 4 & 5)
// 1. Customer checkout with shipping address and COD payment
portalEnv.sandbox.App.openPurchase(addedProd.id);
assert(portalEnv.sandbox.state.activeModal === 'purchase', 'Purchase modal opened for customer');
portalEnv.sandbox.document.getElementById('buy-qty').value = 2;
portalEnv.sandbox.document.getElementById('buy-color').value = 'Rose Gold';
portalEnv.sandbox.document.getElementById('buy-address').value = 'Jl. Kemang Raya No. 12B, Mampang Prapatan, Jakarta Selatan';
portalEnv.sandbox.document.getElementById('buy-payment-method').value = 'COD (Bayar di Tempat)';
portalEnv.sandbox.App.submitPurchase({ preventDefault() {} });

const customerOrder = portalEnv.sandbox.state.data.orders[0];
assert(customerOrder.shippingAddress === 'Jl. Kemang Raya No. 12B, Mampang Prapatan, Jakarta Selatan', 'Customer order saved shippingAddress');
assert(customerOrder.paymentMethod === 'COD (Bayar di Tempat)', 'Customer order saved COD paymentMethod');

// 2. Admin creates order with shipping address and Bank Transfer
adminEnv.sandbox.App.openAddOrder();
assert(adminEnv.sandbox.state.activeModal === 'order', 'Admin order modal opened');
adminEnv.sandbox.document.getElementById('f-ord-cust').value = 'Dina Mariana';
adminEnv.sandbox.document.getElementById('f-ord-prod').value = 'Pashmina Viscose Silk Special';
adminEnv.sandbox.document.getElementById('f-ord-qty').value = 1;
adminEnv.sandbox.document.getElementById('f-ord-total').value = 110000;
adminEnv.sandbox.document.getElementById('f-ord-address').value = 'Jl. R.E. Martadinata No. 55, Bandung';
adminEnv.sandbox.document.getElementById('f-ord-paymethod').value = 'Transfer Bank (Mandiri)';
adminEnv.sandbox.document.getElementById('f-ord-status').value = 'Shipped';
adminEnv.sandbox.App.saveOrder({ preventDefault() {} });

const adminOrder = adminEnv.sandbox.state.data.orders[0];
assert(adminOrder.shippingAddress === 'Jl. R.E. Martadinata No. 55, Bandung', 'Admin order saved shippingAddress');
assert(adminOrder.paymentMethod === 'Transfer Bank (Mandiri)', 'Admin order saved Bank Transfer paymentMethod');

// 3. Admin Orders table displays shipping address and payment badge
adminEnv.sandbox.App.setView('orders');
assert(adminEnv.elements['app'].innerHTML.includes('Alamat Kirim:'), 'Orders table header/column for shipping address displayed');
assert(adminEnv.elements['app'].innerHTML.includes('Jl. R.E. Martadinata No. 55, Bandung'), 'Shipping address rendered in table row');
assert(adminEnv.elements['app'].innerHTML.includes('Transfer Bank (Mandiri)'), 'Payment method badge rendered in table row');

// Test V: Admin saveOrder TDZ Prevention & Empty Address Fallback
adminEnv.sandbox.App.openAddOrder();
adminEnv.sandbox.document.getElementById('f-ord-cust').value = 'Zahra Amelia Putri';
adminEnv.sandbox.document.getElementById('f-ord-prod').value = 'Pashmina Viscose Silk Special';
adminEnv.sandbox.document.getElementById('f-ord-qty').value = 1;
adminEnv.sandbox.document.getElementById('f-ord-total').value = 110000;
adminEnv.sandbox.document.getElementById('f-ord-address').value = ''; // empty string test for TDZ
adminEnv.sandbox.document.getElementById('f-ord-paymethod').value = 'Transfer Bank (BCA)';

let orderSaveCrashed = false;
try {
  adminEnv.sandbox.App.saveOrder({ preventDefault() {} });
} catch (e) {
  orderSaveCrashed = true;
}
assert(!orderSaveCrashed, 'saveOrder with empty address input executes safely without TDZ error');
const fallbackOrder = adminEnv.sandbox.state.data.orders[0];
assert(fallbackOrder.shippingAddress.length > 0, 'Order with empty address input safely falls back to customer address');

// Test W: Product Image Removal & Clearing When Editing
adminEnv.sandbox.App.openEditProduct(addedProd.id);
adminEnv.sandbox.App.clearProductImage();
adminEnv.sandbox.App.saveProduct({ preventDefault() {} });
const clearedProd = adminEnv.sandbox.state.data.products.find(p => p.id === addedProd.id);
assert(clearedProd.image === '', 'Product photo cleanly cleared and not resurrected from old image');

// Test X: CSV Export Contains Shipping Address & Payment Method
let csvOutput = '';
const csvEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella' })
});
csvEnv.sandbox.state.data.orders.push({
  id: 'ORD-CSV-1',
  customerName: 'Dina',
  phone: '08123',
  shippingAddress: 'Jl. Riau 55',
  paymentMethod: 'Transfer Bank (BCA)',
  date: '2026-03-20',
  total: 100000,
  orderStatus: 'Completed'
});
csvEnv.sandbox.document.createElement = function(tag) {
  return {
    set href(v) { csvOutput = decodeURI(v); },
    get href() { return csvOutput; },
    click() {}
  };
};
csvEnv.sandbox.App.exportOrdersCSV();
assert(csvOutput.includes('Alamat Pengiriman') && csvOutput.includes('Metode Pembayaran'), 'CSV export headers include Alamat Pengiriman and Metode Pembayaran');
assert(!csvOutput.includes('Saluran'), 'CSV export headers do NOT include Saluran');

// Test Y: Insight View Empty State Cleanliness
adminEnv.sandbox.App.resetEmptyState();
adminEnv.sandbox.App.setView('insight');
assert(!adminEnv.elements['app'].innerHTML.includes('Muat Data Sampel Uji'), 'Customer Insight empty state does NOT display "Muat Data Sampel Uji" button');

// Test Z: Customer Address Persistence to Profile and Checkout Prefill
const customerAddrEnv = createMockEnv({
  'by_nvdila_users_v2': JSON.stringify({
    'zahra.putri@gmail.com': {
      email: 'zahra.putri@gmail.com',
      password: 'ZahraPass123',
      name: 'Zahra Putri',
      role: 'customer'
    }
  })
});
customerAddrEnv.sandbox.App.loadSampleData();
customerAddrEnv.sandbox.App.setAuthMode('login');
customerAddrEnv.sandbox.state.loginRole = 'customer';
customerAddrEnv.sandbox.document.getElementById('auth-email').value = 'zahra.putri@gmail.com';
customerAddrEnv.sandbox.document.getElementById('auth-password').value = 'ZahraPass123';
customerAddrEnv.sandbox.App.handleAuthSubmit({ preventDefault() {} });
assert(customerAddrEnv.sandbox.state.auth.address === 'Jl. Melati No. 14, Menteng, Jakarta Pusat', 'Customer address synced to auth state on login');

customerAddrEnv.sandbox.App.setPortalTab('profile');
assert(customerAddrEnv.elements['app'].innerHTML.includes('Jl. Melati No. 14, Menteng'), 'Customer profile displays real saved address');


// Test BB: Welcome Greeting Audit
adminEnv.sandbox.App.setView('dashboard');
assert(!adminEnv.elements['app'].innerHTML.toLowerCase().includes('selamat datang di by.nvdila'), 'Admin dashboard does NOT contain welcome greeting');

portalEnv.sandbox.App.setPortalTab('home');
assert(portalEnv.elements['app'].innerHTML.includes('Selamat Datang di by.nvdila'), 'Customer dashboard displays warm welcome greeting');

// Test CC: Follow-up directly displays customer data
adminEnv.sandbox.App.loadSampleData();
adminEnv.sandbox.App.setView('followup');
assert(adminEnv.elements['app'].innerHTML.includes('Zahra Amelia Putri'), 'Follow-up displays customer name directly');
assert(adminEnv.elements['app'].innerHTML.includes('081234567890'), 'Follow-up displays customer phone directly');
assert(adminEnv.elements['app'].innerHTML.includes('Chat WA'), 'Follow-up includes direct WhatsApp action button');

// Test DD: Bidirectional Chat feature
adminEnv.sandbox.App.setView('chat');
assert(adminEnv.elements['app'].innerHTML.includes('Chat &amp; Komunikasi Pelanggan') || adminEnv.elements['app'].innerHTML.includes('Chat & Komunikasi Pelanggan'), 'Admin chat view renders');
adminEnv.sandbox.document.getElementById('admin-chat-input').value = 'Halo pelanggan! Ada yang bisa kami bantu?';
adminEnv.sandbox.App.sendAdminChatMessage({ preventDefault() {} });
assert(adminEnv.sandbox.state.chats.some(m => m.text === 'Halo pelanggan! Ada yang bisa kami bantu?' && m.sender === 'admin'), 'Admin message sent and recorded in state');

portalEnv.sandbox.App.setPortalTab('chat');
assert(portalEnv.elements['app'].innerHTML.includes('Chat Layanan Pelanggan by.nvdila'), 'Customer chat view renders');
portalEnv.sandbox.document.getElementById('cust-chat-input').value = 'Saya mau tanya warna pashmina';
portalEnv.sandbox.App.sendCustomerChatMessage({ preventDefault() {} });
assert(portalEnv.sandbox.state.chats.some(m => m.text === 'Saya mau tanya warna pashmina' && m.sender === 'customer'), 'Customer message sent and recorded in state');

// Test EE: Standard Settings in Admin and Customer
adminEnv.sandbox.App.setView('settings');
assert(adminEnv.elements['app'].innerHTML.includes('Profil Brand &amp; Koleksi Hijab') || adminEnv.elements['app'].innerHTML.includes('Profil Brand & Koleksi Hijab'), 'Admin settings displays brand profile');
assert(adminEnv.elements['app'].innerHTML.includes('Preferensi Toko &amp; Pembayaran') || adminEnv.elements['app'].innerHTML.includes('Preferensi Toko & Pembayaran'), 'Admin settings displays store & payment preferences');
assert(adminEnv.elements['app'].innerHTML.includes('Keamanan Akun Admin'), 'Admin settings displays account security');

portalEnv.sandbox.App.setPortalTab('settings');
assert(portalEnv.elements['app'].innerHTML.includes('Informasi Pribadi &amp; Kontak') || portalEnv.elements['app'].innerHTML.includes('Informasi Pribadi & Kontak'), 'Customer portal displays personal profile info');
assert(portalEnv.elements['app'].innerHTML.includes('Alamat Pengiriman Utama'), 'Customer portal displays shipping address settings');
assert(portalEnv.elements['app'].innerHTML.includes('Keamanan Akun &amp; Kata Sandi') || portalEnv.elements['app'].innerHTML.includes('Keamanan Akun & Kata Sandi'), 'Customer portal displays password settings');

// Test AA: Modal Back/Cancel Buttons Include Back Icon
adminEnv.sandbox.App.openAddCustomer();
assert(adminEnv.elements['app'].innerHTML.includes('← Batal'), 'Customer modal contains ← Batal button');
adminEnv.sandbox.App.closeModal();

adminEnv.sandbox.App.openAddFollowup();
assert(adminEnv.elements['app'].innerHTML.includes('← Batal'), 'Followup modal contains ← Batal button');
adminEnv.sandbox.App.closeModal();

// Test FF: Chats initialized clean in state on fresh load
const chatInitEnv = createMockEnv();
assert(Array.isArray(chatInitEnv.sandbox.state.chats), 'state.chats is initialized as an array');
assert(chatInitEnv.sandbox.state.chats.length === 0, 'state.chats is initially empty (0 dummy messages)');

// Test GG: Reports View contains direct in-app order wording and no channel mention
adminEnv.sandbox.App.setView('reports');
adminEnv.sandbox.App.setReportsTab('sales');
assert(adminEnv.elements['app'].innerHTML.includes('pemesanan langsung tercatat di aplikasi ini'), 'Reports view states pemesanan langsung tercatat');
assert(!adminEnv.elements['app'].innerHTML.includes('seluruh saluran penjualan'), 'Reports view does NOT contain seluruh saluran penjualan');

// Test HH: Free shipping (0 cost) persists accurately in settings
adminEnv.sandbox.App.setView('settings');
adminEnv.sandbox.document.getElementById('set-shipping-cost').value = 0;
adminEnv.sandbox.App.savePaymentSettings({ preventDefault() {} });
const updatedStoreSettings = JSON.parse(adminEnv.store['by_nvdila_store_settings_v1'] || '{}');
assert(updatedStoreSettings.shippingCost === 0, 'Shipping cost can be set to 0 (free shipping) without reverting');

// Test II: Admin password update auto-initializes user record
const freshAdminEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella Nurhardiani' })
});
freshAdminEnv.sandbox.App.setView('settings');
freshAdminEnv.sandbox.document.getElementById('set-admin-new-pwd').value = 'NewAdminSecret999';
freshAdminEnv.sandbox.document.getElementById('set-admin-confirm-pwd').value = 'NewAdminSecret999';
freshAdminEnv.sandbox.App.saveAdminPassword({ preventDefault() {} });
const freshUsers = JSON.parse(freshAdminEnv.store['by_nvdila_users_v2'] || '{}');
assert(freshUsers['sellanrhrdni123@gmail.com'] !== undefined, 'Admin record initialized in users on password change');
assert(freshUsers['sellanrhrdni123@gmail.com'].password === 'NewAdminSecret999', 'Admin password accurately saved in users');

// Test JJ: Customer password update auto-initializes user record
const freshCustEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'fatimah@bynvdila.com', name: 'Fatimah' })
});
freshCustEnv.sandbox.App.setPortalTab('settings');
freshCustEnv.sandbox.document.getElementById('cust-new-pwd').value = 'FatimahSecure789';
freshCustEnv.sandbox.document.getElementById('cust-confirm-pwd').value = 'FatimahSecure789';
freshCustEnv.sandbox.App.saveCustomerPassword({ preventDefault() {} });
const custUsers = JSON.parse(freshCustEnv.store['by_nvdila_users_v2'] || '{}');
assert(custUsers['fatimah@bynvdila.com'] !== undefined, 'Customer record initialized in users on password change');
assert(custUsers['fatimah@bynvdila.com'].password === 'FatimahSecure789', 'Customer password accurately saved in users');

// Test KK: closeModal resets tempProductImage
adminEnv.sandbox.state.tempProductImage = 'data:image/png;base64,temporaryImageLeak';
adminEnv.sandbox.App.closeModal();
assert(adminEnv.sandbox.state.tempProductImage === '', 'closeModal cleans up tempProductImage');

// Test LL: Clean State Without Dummy Data on Fresh Load
const freshCleanEnv = createMockEnv();
assert(freshCleanEnv.sandbox.state.data.customers.length === 0, 'Fresh database has 0 dummy customers');
assert(freshCleanEnv.sandbox.state.data.products.length === 0, 'Fresh database has 0 dummy products');
assert(freshCleanEnv.sandbox.state.data.orders.length === 0, 'Fresh database has 0 dummy orders');
assert(freshCleanEnv.sandbox.state.data.followups.length === 0, 'Fresh database has 0 dummy followups');
assert(freshCleanEnv.sandbox.state.data.activities.length === 0, 'Fresh database has 0 dummy activities');
assert(freshCleanEnv.sandbox.state.chats.length === 0, 'Fresh database has 0 dummy chats');

// Test MM: Admin Dashboard does not render "+ Tambah Pesanan" or "+ Tambah Pelanggan"
const dashAdminEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella' })
});
dashAdminEnv.sandbox.App.setView('dashboard');
assert(!dashAdminEnv.elements['app'].innerHTML.includes('+ Tambah Pesanan'), 'Admin dashboard does NOT contain "+ Tambah Pesanan" button');
assert(!dashAdminEnv.elements['app'].innerHTML.includes('+ Tambah Pelanggan'), 'Admin dashboard does NOT contain "+ Tambah Pelanggan" button');

// Test NN: Admin Dashboard KPI Cards are Clickable
dashAdminEnv.sandbox.App.navigateToView('customers');
assert(dashAdminEnv.sandbox.state.view === 'customers', 'Total Pelanggan card navigates to customers view');
dashAdminEnv.sandbox.App.navigateToSegment('New Customer');
assert(dashAdminEnv.sandbox.state.view === 'customers' && dashAdminEnv.sandbox.state.customerFilterSegment === 'New Customer', 'Pelanggan Baru card navigates to filtered customers view');
dashAdminEnv.sandbox.App.navigateToView('orders');
assert(dashAdminEnv.sandbox.state.view === 'orders', 'Total Pesanan card navigates to orders view');
dashAdminEnv.sandbox.App.navigateToView('reports');
assert(dashAdminEnv.sandbox.state.view === 'reports', 'Total Penjualan card navigates to reports view');
dashAdminEnv.sandbox.App.navigateToRepeatCustomers();
assert(dashAdminEnv.sandbox.state.view === 'customers', 'Repeat Customers card navigates to repeat customers');

// Test OO: Follow-up Stat Cards are Clickable
dashAdminEnv.sandbox.App.setView('followup');
dashAdminEnv.sandbox.App.handleFollowupStatClick('needs_attention');
assert(dashAdminEnv.sandbox.state.followupFilterSegment === 'New Customer', 'Perlu Follow-up Cepat card activates filter');
dashAdminEnv.sandbox.App.handleFollowupStatClick('total');
assert(dashAdminEnv.sandbox.state.followupFilterSegment === 'ALL', 'Total Pelanggan Terdaftar card resets filter to ALL');

// Test PP: Customer Dashboard Stat Cards are Clickable
const custPortalEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'humaira@bynvdila.com', name: 'Humaira' })
});
custPortalEnv.sandbox.App.handleCustomerStatClick('member');
assert(custPortalEnv.sandbox.state.activeModal === 'memberInfo', 'Status Member card opens memberInfo modal');
custPortalEnv.sandbox.App.closeModal();
custPortalEnv.sandbox.App.handleCustomerStatClick('active_orders');
assert(custPortalEnv.sandbox.state.customerPortalTab === 'my-orders', 'Pesanan Aktif card switches to my-orders tab');
custPortalEnv.sandbox.App.handleCustomerStatClick('total_orders');
assert(custPortalEnv.sandbox.state.customerPortalTab === 'my-orders', 'Total Pesanan card switches to my-orders tab');
custPortalEnv.sandbox.App.handleCustomerStatClick('total_spent');
assert(custPortalEnv.sandbox.state.customerPortalTab === 'history', 'Total Belanja card switches to history tab');

// Test QQ: Customer order automatically creates customer record and records order
const newCustOrderEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'zahidah@gmail.com', name: 'Zahidah' })
});
newCustOrderEnv.sandbox.state.data.products.push({
  id: 'PRD-TEST-ZH',
  name: 'Bergo Instan Zahidah',
  price: 59000,
  stock: 5,
  color: 'Caramel',
  status: 'Tersedia'
});
newCustOrderEnv.sandbox.App.openPurchase('PRD-TEST-ZH');
newCustOrderEnv.sandbox.document.getElementById('buy-qty').value = 1;
newCustOrderEnv.sandbox.document.getElementById('buy-address').value = 'Jl. Anggrek No. 99, Surabaya';
newCustOrderEnv.sandbox.App.submitPurchase({ preventDefault() {} });
assert(newCustOrderEnv.sandbox.state.data.orders.length === 1, 'Order automatically recorded in database');
const autoCreatedCustomer = newCustOrderEnv.sandbox.state.data.customers.find(c => c.email === 'zahidah@gmail.com');
assert(autoCreatedCustomer !== undefined, 'Customer record automatically created in database upon ordering');
assert(autoCreatedCustomer.name === 'Zahidah', 'Auto-created customer name is accurate');
assert(autoCreatedCustomer.address === 'Jl. Anggrek No. 99, Surabaya', 'Auto-created customer address saved');

// Test RR: Repeat Customers filter accurately isolates repeat customers
const repeatEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella' })
});
repeatEnv.sandbox.state.data.customers = [
  { id: 'CUST-A', name: 'Pelanggan Baru A', segment: 'New Customer' },
  { id: 'CUST-B', name: 'Pelanggan Repeat B', segment: 'Regular Customer' },
  { id: 'CUST-C', name: 'Pelanggan Loyal C', segment: 'Loyal Customer' }
];
repeatEnv.sandbox.state.data.orders = [
  { id: 'ORD-1', customerId: 'CUST-A', total: 50000, orderStatus: 'Completed' },
  { id: 'ORD-2', customerId: 'CUST-B', total: 50000, orderStatus: 'Completed' },
  { id: 'ORD-3', customerId: 'CUST-B', total: 50000, orderStatus: 'Completed' },
  { id: 'ORD-4', customerId: 'CUST-C', total: 200000, orderStatus: 'Completed' },
  { id: 'ORD-5', customerId: 'CUST-C', total: 200000, orderStatus: 'Completed' }
];
repeatEnv.sandbox.App.navigateToRepeatCustomers();
assert(repeatEnv.sandbox.state.customerFilterSegment === 'REPEAT', 'Repeat Customers filter set to REPEAT');
repeatEnv.sandbox.render();
assert(repeatEnv.elements['app'].innerHTML.includes('Pelanggan Repeat B'), 'Repeat customers view includes Regular Customer');
assert(repeatEnv.elements['app'].innerHTML.includes('Pelanggan Loyal C'), 'Repeat customers view includes Loyal Customer');
assert(!repeatEnv.elements['app'].innerHTML.includes('Pelanggan Baru A'), 'Repeat customers view excludes 1-time New Customer');

// Test SS: Order modal input values are clean on fresh database
const freshOrderModalEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella' })
});
freshOrderModalEnv.sandbox.App.openAddOrder();
assert(freshOrderModalEnv.sandbox.state.activeModal === 'order', 'Order modal opened on fresh env');
const custInputVal = freshOrderModalEnv.sandbox.document.getElementById('f-ord-cust').value;
const totalInputVal = freshOrderModalEnv.sandbox.document.getElementById('f-ord-total').value;
assert(custInputVal === '', 'Order modal customer name is initially empty without dummy data');
assert(totalInputVal === '' || totalInputVal === '0', 'Order modal total is initially empty without dummy 89000');
freshOrderModalEnv.sandbox.App.closeModal();

// Test TT: handleFollowupStatClick handles navigation from non-followup view
const followupNavEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella' })
});
followupNavEnv.sandbox.state.view = 'dashboard';
followupNavEnv.sandbox.App.handleFollowupStatClick('reminders');
assert(followupNavEnv.sandbox.state.view === 'followup', 'handleFollowupStatClick switches view to followup');

// Test UU: Member info and Points info modal actions
custPortalEnv.sandbox.App.handleCustomerStatClick('member');
assert(custPortalEnv.sandbox.state.activeModal === 'memberInfo', 'Member info modal opens');
custPortalEnv.sandbox.render();
assert(custPortalEnv.elements['app'].innerHTML.includes('Buka Profil Member →'), 'Member info modal contains profile shortcut');
custPortalEnv.sandbox.App.closeModal();

// Test Admin and Customer Clear Chat features
const adminChatEnv = createMockEnv();
adminChatEnv.sandbox.state.chats = [
  { id: '1', customerId: 'CUST-1', customerName: 'Zahra', text: 'Hai admin', sender: 'customer', timestamp: new Date().toISOString() },
  { id: '2', customerId: 'CUST-2', customerName: 'Lina', text: 'Halo admin', sender: 'customer', timestamp: new Date().toISOString() }
];
adminChatEnv.sandbox.state.activeChatCustomer = 'CUST-1';
adminChatEnv.sandbox.confirm = () => true;
adminChatEnv.sandbox.App.clearAdminChat('CUST-1');
assert(adminChatEnv.sandbox.state.chats.every(c => c.customerId !== 'CUST-1'), 'Admin can clear chat history with customer');

// Edge Case 1: Case-insensitive clearAdminChat with mixed sender messages
adminChatEnv.sandbox.state.chats = [
  { id: '10', customerId: 'CUST-3', customerEmail: 'anisa@example.com', text: 'Halo', sender: 'customer', timestamp: new Date().toISOString() },
  { id: '11', customerId: 'CUST-3', customerEmail: 'anisa@example.com', text: 'Halo Anisa', sender: 'admin', timestamp: new Date().toISOString() },
  { id: '12', customerId: 'CUST-4', customerEmail: 'dewi@example.com', text: 'Stok ada?', sender: 'customer', timestamp: new Date().toISOString() }
];
adminChatEnv.sandbox.App.clearAdminChat('cust-3');
assert(adminChatEnv.sandbox.state.chats.every(c => c.customerId !== 'CUST-3'), 'Admin clearAdminChat handles case-insensitive ID and wipes both sender roles');

// Edge Case 2: Guest/unregistered customer chat wiped and activeChatCustomer safely reset
const guestChatEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella' })
});
guestChatEnv.sandbox.state.data.customers = [{ id: 'CUST-EXIST', name: 'Existing Customer', email: 'exist@example.com' }];
guestChatEnv.sandbox.state.chats = [
  { id: 'g1', customerEmail: 'guest@example.com', text: 'Tanya pashmina', sender: 'customer', timestamp: new Date().toISOString() }
];
guestChatEnv.sandbox.App.setView('chat');
guestChatEnv.sandbox.App.setActiveChatCustomer('guest@example.com');
guestChatEnv.sandbox.confirm = () => true;
guestChatEnv.sandbox.App.clearAdminChat('guest@example.com');
guestChatEnv.sandbox.render();
assert(guestChatEnv.sandbox.state.chats.length === 0, 'Guest chat history wiped cleanly');
assert(guestChatEnv.sandbox.state.activeChatCustomer !== 'guest@example.com', 'activeChatCustomer safely reset and not left as ghost customer');

const custChatEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'zahra@example.com', customerId: 'CUST-1', name: 'Zahra' })
});
custChatEnv.sandbox.state.chats = [
  { id: '1', customerId: 'CUST-1', customerEmail: 'zahra@example.com', text: 'Tanya pashmina', sender: 'customer', timestamp: new Date().toISOString() },
  { id: '2', customerId: 'CUST-2', customerEmail: 'other@example.com', text: 'Tanya bergo', sender: 'customer', timestamp: new Date().toISOString() },
  { id: '3', customerId: 'CUST-1', customerEmail: 'zahra@example.com', text: 'Bisa kak, warna ready', sender: 'admin', timestamp: new Date().toISOString() }
];
custChatEnv.sandbox.confirm = () => true;
custChatEnv.sandbox.App.clearCustomerChat();
assert(custChatEnv.sandbox.state.chats.every(c => c.customerId !== 'CUST-1'), 'Customer can clear their own chat history including replies from admin');

// Edge Case 3: Customer cancellation in confirm dialog preserves chat
const cancelChatEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'zahra@example.com', customerId: 'CUST-1', name: 'Zahra' })
});
cancelChatEnv.sandbox.state.chats = [
  { id: 'c1', customerId: 'CUST-1', customerEmail: 'zahra@example.com', text: 'Jangan dihapus', sender: 'customer', timestamp: new Date().toISOString() }
];
cancelChatEnv.sandbox.confirm = () => false; // User cancels
cancelChatEnv.sandbox.App.clearCustomerChat();
assert(cancelChatEnv.sandbox.state.chats.length === 1, 'Chat history preserved when customer cancels confirmation dialog');

// Test VV: Absolute removal of Points Discount & verification of Boutique Hijab Aesthetics
const portalAuditEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'wardah@bynvdila.com', name: 'Wardah' })
});
portalAuditEnv.sandbox.render();
const portalHtml = portalAuditEnv.elements['app'].innerHTML;
assert(!portalHtml.includes('Poin Belanja'), 'Customer Dashboard does NOT contain Poin Belanja card');
assert(!portalHtml.includes('Poin Loyalitas'), 'Customer Dashboard does NOT contain Poin Loyalitas');
assert(!/diskon\s*poin/i.test(portalHtml), 'Customer Dashboard does NOT contain diskon poin');
assert(portalHtml.includes('Total Pesanan'), 'Customer Dashboard contains Total Pesanan overview');
assert(portalHtml.includes('Konsultasi Warna &amp; Bahan Hijab Personal') || portalHtml.includes('Konsultasi Warna & Bahan Hijab Personal'), 'Customer Dashboard contains Stylist Consultation luxury banner');
assert(portalHtml.includes('Koleksi Paling Diminati'), 'Customer Dashboard contains Koleksi Paling Diminati section');
assert(portalHtml.includes('Bahan Viscose Modal Alami'), 'Customer Dashboard displays natural viscose modal boutique highlight');
assert(portalHtml.includes('Garansi Jahitan 100%'), 'Customer Dashboard displays 100% Boutique stitching guarantee');

// Test WW: Product Color Validation (Strict Rejection of Unlisted Colors)
const colorEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'customer', email: 'anisa@bynvdila.com', name: 'Anisa' })
});
colorEnv.sandbox.state.data.products = [
  { id: 'PRD-COLOR-TEST', name: 'Pashmina Viscose Warna Test', price: 89000, stock: 10, color: 'Espresso, Soft Sand, Broken White', status: 'Tersedia' }
];

// 1. Customer attempts purchase with unlisted color "Kuning Kunyit"
colorEnv.sandbox.App.openPurchase('PRD-COLOR-TEST');
assert(colorEnv.sandbox.state.activeModal === 'purchase', 'Checkout modal opened for color testing');
colorEnv.sandbox.document.getElementById('buy-qty').value = 1;
colorEnv.sandbox.document.getElementById('buy-address').value = 'Jl. Anisa No. 5, Bandung';
colorEnv.sandbox.document.getElementById('buy-color').value = 'Kuning Kunyit';
colorEnv.sandbox.App.submitPurchase({ preventDefault() {} });

assert(colorEnv.alertMessages.includes('warna tidak tersedia/habis'), 'Rejection alert triggered with exact message "warna tidak tersedia/habis"');
assert(colorEnv.sandbox.state.activeModal === 'purchase', 'Modal not dismissed on invalid color rejection');
assert(colorEnv.sandbox.state.data.orders.length === 0, 'No order recorded on invalid color purchase');
assert(colorEnv.sandbox.state.data.products[0].stock === 10, 'Product stock unchanged on invalid color purchase');

// 2. Customer attempts purchase with empty color string
colorEnv.alertMessages.length = 0;
colorEnv.sandbox.document.getElementById('buy-color').value = '   ';
colorEnv.sandbox.App.submitPurchase({ preventDefault() {} });
assert(colorEnv.alertMessages.includes('warna tidak tersedia/habis'), 'Rejection alert triggered for whitespace color');
assert(colorEnv.sandbox.state.data.orders.length === 0, 'No order recorded for empty color');

// 3. Customer attempts purchase with valid color but different casing and spaces ("  eSpReSsO  ")
colorEnv.alertMessages.length = 0;
colorEnv.sandbox.document.getElementById('buy-color').value = '  eSpReSsO  ';
colorEnv.sandbox.App.submitPurchase({ preventDefault() {} });
assert(!colorEnv.alertMessages.includes('warna tidak tersedia/habis'), 'No rejection alert for valid color with whitespace/case variation');
assert(colorEnv.sandbox.state.activeModal === null, 'Modal dismissed after valid color purchase');
assert(colorEnv.sandbox.state.data.orders.length === 1, 'Order successfully recorded for valid color');
assert(colorEnv.sandbox.state.data.orders[0].items[0].color === 'eSpReSsO', 'Order recorded accurate chosen color');
assert(colorEnv.sandbox.state.data.products[0].stock === 9, 'Stock decremented after valid color purchase');

// 4. Product with no colors listed rejects any color entry
colorEnv.sandbox.state.data.products.push({
  id: 'PRD-NO-COLOR',
  name: 'Hijab Tanpa Warna',
  price: 50000,
  stock: 5,
  color: '',
  status: 'Tersedia'
});
colorEnv.sandbox.App.openPurchase('PRD-NO-COLOR');
colorEnv.sandbox.document.getElementById('buy-color').value = 'Hitam';
colorEnv.alertMessages.length = 0;
colorEnv.sandbox.App.submitPurchase({ preventDefault() {} });
assert(colorEnv.alertMessages.includes('warna tidak tersedia/habis'), 'Product without listed colors rejects any color purchase');

// 5. Direct invocation of processCustomerPurchase with invalid color rejects cleanly
colorEnv.alertMessages.length = 0;
const prodWithColor = colorEnv.sandbox.state.data.products[0];
const res = colorEnv.sandbox.processCustomerPurchase(prodWithColor, 1, 'WarnaPalsu', 'Alamat', 'COD');
assert(res === false, 'processCustomerPurchase returns false when color is not available');
assert(colorEnv.alertMessages.includes('warna tidak tersedia/habis'), 'processCustomerPurchase alerts "warna tidak tersedia/habis"');

// 6. Product with slash-separated colors accepts individual color ("Hitam / Putih / Mocca")
colorEnv.sandbox.state.data.products.push({
  id: 'PRD-SLASH-TEST',
  name: 'Pashmina Viscose Slash Colors',
  price: 75000,
  stock: 10,
  color: 'Hitam / Putih / Mocca',
  status: 'Tersedia'
});
colorEnv.alertMessages.length = 0;
colorEnv.sandbox.App.openPurchase('PRD-SLASH-TEST');
colorEnv.sandbox.document.getElementById('buy-color').value = 'Hitam';
colorEnv.sandbox.App.submitPurchase({ preventDefault() {} });
assert(!colorEnv.alertMessages.includes('warna tidak tersedia/habis'), 'Slash-separated color string accepts first valid color');
assert(colorEnv.sandbox.state.data.orders.some(o => o.items[0].color === 'Hitam'), 'Order successfully recorded for slash color Hitam');

// 7. Slash-separated colors reject unlisted color ("Navy")
colorEnv.alertMessages.length = 0;
colorEnv.sandbox.App.openPurchase('PRD-SLASH-TEST');
colorEnv.sandbox.document.getElementById('buy-color').value = 'Navy';
colorEnv.sandbox.App.submitPurchase({ preventDefault() {} });
assert(colorEnv.alertMessages.includes('warna tidak tersedia/habis'), 'Slash-separated product rejects unlisted color Navy');

// 8. Product with semicolon-separated colors ("Sage; Dusty; Rose")
colorEnv.sandbox.state.data.products.push({
  id: 'PRD-SEMI-TEST',
  name: 'Pashmina Viscose Semicolon Colors',
  price: 75000,
  stock: 10,
  color: 'Sage; Dusty; Rose',
  status: 'Tersedia'
});
colorEnv.alertMessages.length = 0;
colorEnv.sandbox.App.openPurchase('PRD-SEMI-TEST');
colorEnv.sandbox.document.getElementById('buy-color').value = 'Dusty';
colorEnv.sandbox.App.submitPurchase({ preventDefault() {} });
assert(!colorEnv.alertMessages.includes('warna tidak tersedia/habis'), 'Semicolon-separated color string accepts valid color Dusty');

// 9. Product with array of colors
const prodArrayColor = {
  id: 'PRD-ARR-TEST',
  name: 'Pashmina Array Colors',
  price: 85000,
  stock: 10,
  color: ['Caramel', 'Oatmeal', 'Espresso'],
  status: 'Tersedia'
};
assert(colorEnv.sandbox.isProductColorAvailable(prodArrayColor, 'Oatmeal'), 'Array of colors safely matches Oatmeal');
assert(!colorEnv.sandbox.isProductColorAvailable(prodArrayColor, 'Kuning'), 'Array of colors rejects unlisted Kuning');

// 10. Non-breaking space \u00A0 in customer color input is normalized
assert(colorEnv.sandbox.isProductColorAvailable(prodArrayColor, 'Caramel\u00A0'), 'Non-breaking space in requested color is handled gracefully');

// Test XX: Admin Dashboard Responsiveness (Mobile, Tablet, Desktop)
const responsiveEnv = createMockEnv({
  'by_nvdila_auth_v2': JSON.stringify({ role: 'admin', email: 'sellanrhrdni123@gmail.com', name: 'Sella' })
});
responsiveEnv.sandbox.render();

// 1. Mobile menu toggle in Topbar & initial state
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'sidebarOpen is initially false');
assert(responsiveEnv.elements['app'].innerHTML.includes('mobile-menu-btn'), 'Topbar renders mobile menu button');
assert(responsiveEnv.elements['app'].innerHTML.includes('sidebar-backdrop'), 'Admin layout renders mobile sidebar backdrop');
assert(responsiveEnv.elements['app'].innerHTML.includes('sidebar-close-btn'), 'Sidebar renders mobile close button');

// 2. Toggling sidebar opens drawer
responsiveEnv.sandbox.App.toggleSidebar();
assert(responsiveEnv.sandbox.state.sidebarOpen === true, 'toggleSidebar sets sidebarOpen to true');
assert(responsiveEnv.elements['app'].innerHTML.includes('sidebar open'), 'Sidebar gains open class when sidebarOpen is true');
assert(responsiveEnv.elements['app'].innerHTML.includes('sidebar-backdrop open'), 'Backdrop gains open class when sidebarOpen is true');

// 3. Closing sidebar shuts drawer
responsiveEnv.sandbox.App.closeSidebar();
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'closeSidebar sets sidebarOpen to false');

// 4. Navigating to views auto-closes mobile sidebar
responsiveEnv.sandbox.App.toggleSidebar();
assert(responsiveEnv.sandbox.state.sidebarOpen === true, 'Sidebar opened before navigation');
responsiveEnv.sandbox.App.setView('orders');
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'setView auto-closes mobile sidebar');

responsiveEnv.sandbox.App.toggleSidebar();
responsiveEnv.sandbox.App.navigateToView('customers');
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'navigateToView auto-closes mobile sidebar');

responsiveEnv.sandbox.App.toggleSidebar();
responsiveEnv.sandbox.App.navigateToSegment('VIP Customer');
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'navigateToSegment auto-closes mobile sidebar');

responsiveEnv.sandbox.App.toggleSidebar();
responsiveEnv.sandbox.App.navigateToRepeatCustomers();
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'navigateToRepeatCustomers auto-closes mobile sidebar');

responsiveEnv.sandbox.App.toggleSidebar();
responsiveEnv.sandbox.App.viewCustomer('CUST-001');
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'viewCustomer auto-closes mobile sidebar');

responsiveEnv.sandbox.App.toggleSidebar();
responsiveEnv.sandbox.App.backToCustomerList();
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'backToCustomerList auto-closes mobile sidebar');

responsiveEnv.sandbox.App.toggleSidebar();
responsiveEnv.sandbox.App.switchToPortal();
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'switchToPortal auto-closes mobile sidebar');

responsiveEnv.sandbox.App.switchToAdmin();
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'switchToAdmin maintains closed mobile sidebar');

responsiveEnv.sandbox.App.toggleSidebar();
responsiveEnv.sandbox.App.logout();
assert(responsiveEnv.sandbox.state.sidebarOpen === false, 'logout auto-closes mobile sidebar');

// 5. CSS Responsiveness Verification in appHtml
assert(appHtml.includes('@media (max-width: 900px)'), 'app.html contains @media (max-width: 900px) for tablet/mobile');
assert(appHtml.includes('@media (max-width: 600px)'), 'app.html contains @media (max-width: 600px) for phones');
assert(appHtml.includes('@media (max-width: 380px)'), 'app.html contains @media (max-width: 380px) for compact devices');
assert(appHtml.includes('overflow-x: auto'), 'app.html tables and charts support horizontal scrolling');
assert(appHtml.includes('min-width: 580px'), 'app.html table has minimum readable width');
assert(appHtml.includes('white-space: nowrap'), 'app.html headers protect column layout');
assert(appHtml.includes('flex-wrap: wrap'), 'app.html topbar supports wrap on mobile');

console.log(`\n====================================================`);
console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!       `);
console.log(`====================================================`);


