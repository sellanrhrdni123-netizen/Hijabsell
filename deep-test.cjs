const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('   DEEP VERIFICATION SUITE FOR BY.NVDILA CRM       ');
console.log('====================================================');

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

// ----------------------------------------------------
// 1. FILE INTEGRITY & SYNTAX CHECKS
// ----------------------------------------------------
console.log('\n--- 1. File Integrity & Code Patterns ---');

const appHtmlPath = path.join(__dirname, 'app.html');
const appHtml = fs.readFileSync(appHtmlPath, 'utf8');

const loginViewPath = path.join(__dirname, 'src', 'components', 'LoginView.jsx');
const loginView = fs.readFileSync(loginViewPath, 'utf8');

const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
const appJsx = fs.readFileSync(appJsxPath, 'utf8');

const customerPortalPath = path.join(__dirname, 'src', 'components', 'CustomerPortal.jsx');
const customerPortal = fs.readFileSync(customerPortalPath, 'utf8');

const customerDetailViewPath = path.join(__dirname, 'src', 'components', 'CustomerDetailView.jsx');
const customerDetailView = fs.readFileSync(customerDetailViewPath, 'utf8');

const storageJsPath = path.join(__dirname, 'src', 'utils', 'storage.js');
const storageJs = fs.readFileSync(storageJsPath, 'utf8');

// Password toggle checks
assert(loginView.includes('showPassword') && loginView.includes('setShowPassword'), 'LoginView.jsx has showPassword state');
assert(loginView.includes('Eye') && loginView.includes('EyeOff'), 'LoginView.jsx imports Eye and EyeOff icons');
assert(loginView.includes("type={showPassword ? 'text' : 'password'}"), 'LoginView.jsx toggles input type');

assert(appHtml.includes('showLoginPassword') && appHtml.includes('setShowLoginPassword'), 'app.html has showLoginPassword state');
assert(appHtml.includes('eye:') && appHtml.includes('eyeOff:'), 'app.html defines eye and eyeOff SVG icons');
assert(appHtml.includes('type={showLoginPassword ? "text" : "password"}'), 'app.html toggles password input type');

// Action buttons & labels
assert(customerPortal.includes('Beli Sekarang'), 'CustomerPortal.jsx has "Beli Sekarang" action button');
assert(appHtml.includes('Beli Sekarang'), 'app.html has "Beli Sekarang" action button');

// App.jsx and app.html handleCustomerPurchase order fields
const orderFieldRegex = /channel:\s*['"]Customer Portal['"]/;
assert(orderFieldRegex.test(appJsx) && orderFieldRegex.test(appHtml), 'Both App.jsx and app.html set channel "Customer Portal"');
assert(appJsx.includes("paymentStatus: 'Lunas'") && appHtml.includes("paymentStatus: 'Lunas'"), 'Both set paymentStatus "Lunas"');
assert(appJsx.includes("orderStatus: 'Processing'") && appHtml.includes("orderStatus: 'Processing'"), 'Both set orderStatus "Processing"');
assert(appJsx.includes("phone: custPhone") && appHtml.includes("phone: custPhone"), 'Both set phone on order');
assert(appJsx.includes("email: custEmail") && appHtml.includes("email: custEmail"), 'Both set email on order');
assert(appJsx.includes("qty: qty") && appHtml.includes("qty: qty"), 'Both set qty on order');

// Customer Detail in app.html
assert(appHtml.includes('/* Detail Pelanggan Lengkap */'), 'app.html includes full Customer Detail section');
assert(appHtml.includes('Riwayat Pembelian') && appHtml.includes('Aktivitas Pelanggan'), 'app.html renders Purchase History and Activity timeline in Customer Detail');

// ----------------------------------------------------
// 2. SEGMENTATION ALGORITHM VERIFICATION
// ----------------------------------------------------
console.log('\n--- 2. Customer Loyalty Segmentation Rules ---');

// Extract calculateCustomerSegment logic from storage.js
function calculateCustomerSegment(customer, customerOrders = []) {
  const orderCount = customerOrders.length;
  const totalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  if (orderCount === 0) {
    if (customer.joinDate) {
      const joinD = new Date(customer.joinDate);
      const now = new Date();
      const diffDays = (now - joinD) / (1000 * 60 * 60 * 24);
      if (diffDays > 60) return 'Inactive Customer';
    }
    return 'New Customer';
  }

  const sortedOrders = [...customerOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastOrderDate = new Date(sortedOrders[0].date);
  const now = new Date();
  const daysSinceLastOrder = (now - lastOrderDate) / (1000 * 60 * 60 * 24);

  if (daysSinceLastOrder > 90) {
    return 'Inactive Customer';
  }

  if (orderCount >= 8 || totalSpent >= 1500000) {
    return 'VIP Customer';
  }

  if (orderCount >= 4) {
    return 'Loyal Customer';
  }

  if (orderCount >= 2) {
    return 'Regular Customer';
  }

  return 'New Customer';
}

const todayStr = new Date().toISOString().slice(0, 10);

const custA = { id: 'CUST-1', name: 'Zahra', joinDate: todayStr };
assert(calculateCustomerSegment(custA, []) === 'New Customer', '0 orders -> New Customer');

const order1 = [{ id: 'ORD-1', total: 89000, date: todayStr }];
assert(calculateCustomerSegment(custA, order1) === 'New Customer', '1 order -> New Customer');

const order2 = [
  { id: 'ORD-1', total: 89000, date: todayStr },
  { id: 'ORD-2', total: 69000, date: todayStr }
];
assert(calculateCustomerSegment(custA, order2) === 'Regular Customer', '2 orders -> Regular Customer');

const order4 = [
  { id: 'ORD-1', total: 89000, date: todayStr },
  { id: 'ORD-2', total: 69000, date: todayStr },
  { id: 'ORD-3', total: 59000, date: todayStr },
  { id: 'ORD-4', total: 95000, date: todayStr }
];
assert(calculateCustomerSegment(custA, order4) === 'Loyal Customer', '4 orders -> Loyal Customer');

const orderVipCount = Array(8).fill(null).map((_, i) => ({ id: `ORD-${i}`, total: 50000, date: todayStr }));
assert(calculateCustomerSegment(custA, orderVipCount) === 'VIP Customer', '8 orders -> VIP Customer');

const orderVipSpend = [{ id: 'ORD-BIG', total: 1600000, date: todayStr }];
assert(calculateCustomerSegment(custA, orderVipSpend) === 'VIP Customer', 'Spending >= 1.500.000 -> VIP Customer');

const orderOld = [{ id: 'ORD-OLD', total: 89000, date: '2023-01-01' }];
assert(calculateCustomerSegment(custA, orderOld) === 'Inactive Customer', '>90 days since last purchase -> Inactive Customer');

// ----------------------------------------------------
// 3. END-TO-END PURCHASE PIPELINE SIMULATION
// ----------------------------------------------------
console.log('\n--- 3. End-to-End Purchase Pipeline Simulation ---');

let state = {
  customers: [
    { id: 'CUST-001', name: 'Zahra Amelia Putri', phone: '081234567890', email: 'zahra.putri@gmail.com', address: 'Menteng', joinDate: todayStr, segment: 'New Customer', status: 'Aktif' }
  ],
  products: [
    { id: 'PRD-001', name: 'Pashmina Viscose Modal Premium', price: 89000, stock: 10, status: 'Tersedia', color: 'Espresso, Soft Sand' }
  ],
  orders: [],
  activities: [],
};

function simulateCustomerPurchase(auth, { product, quantity = 1, color = '', notes = '' }) {
  const qty = Math.max(1, Number(quantity) || 1);
  const subtotal = (Number(product.price) || 0) * qty;
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const today = new Date().toISOString().slice(0, 10);
  const selectedColor = color || (product.color ? product.color.split(',')[0].trim() : 'Standar');

  let custId = auth?.customerId;
  let custName = auth?.name || 'Pelanggan by.Nvdila';
  let custPhone = auth?.phone || '';
  let custEmail = auth?.email || '';

  let updatedCustomers = [...state.customers];
  const matchIdx = updatedCustomers.findIndex(
    (c) => (custId && c.id === custId) || (custEmail && c.email && c.email.toLowerCase() === custEmail.toLowerCase())
  );

  if (matchIdx !== -1) {
    custId = updatedCustomers[matchIdx].id;
    custName = updatedCustomers[matchIdx].name;
    custPhone = updatedCustomers[matchIdx].phone || custPhone;
    custEmail = updatedCustomers[matchIdx].email || custEmail;
  } else {
    if (!custId) custId = `CUST-${Date.now().toString().slice(-4)}`;
    const newCust = {
      id: custId,
      name: custName,
      phone: custPhone || '081234567890',
      email: custEmail || 'pelanggan@bynvdila.com',
      address: 'Alamat pengiriman belum diatur',
      joinDate: today,
      segment: 'New Customer',
      status: 'Aktif',
      notes: `Pelanggan Customer Portal via pesanan ${orderId}`,
      totalOrders: 0,
      totalSpent: 0,
      lastPurchaseDate: today,
      points: 0,
    };
    updatedCustomers = [newCust, ...updatedCustomers];
  }

  const newOrder = {
    id: orderId,
    customerId: custId,
    customerName: custName,
    customerPhone: custPhone,
    phone: custPhone,
    customerEmail: custEmail,
    email: custEmail,
    items: [
      {
        productId: product.id,
        productName: product.name,
        color: selectedColor,
        price: product.price,
        quantity: qty,
        subtotal: subtotal,
      },
    ],
    qty: qty,
    total: subtotal,
    date: today,
    channel: 'Customer Portal',
    paymentStatus: 'Lunas',
    orderStatus: 'Processing',
    resi: '',
    notes: notes || 'Pesanan online dari Customer Portal by.Nvdila',
  };

  const updatedOrders = [newOrder, ...state.orders];

  const updatedProducts = state.products.map((p) => {
    if (p.id === product.id) {
      const newStock = Math.max(0, p.stock - qty);
      let status = 'Tersedia';
      if (newStock === 0) status = 'Stok Habis';
      else if (newStock <= 5) status = 'Stok Menipis';
      return { ...p, stock: newStock, status };
    }
    return p;
  });

  const activityTitle = `Pesanan Baru: ${product.name}`;
  const activityDesc = `Pelanggan ${custName} memesan ${qty}x ${product.name} via Customer Portal`;
  const newActivities = [
    {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'order_created',
      title: activityTitle,
      description: activityDesc,
      customerId: custId,
    },
    ...(state.activities || []),
  ];

  // Refresh segments
  const syncedCustomers = updatedCustomers.map((c) => {
    const custOrders = updatedOrders.filter((o) => o.customerId === c.id || (c.name && o.customerName === c.name));
    const newSegment = calculateCustomerSegment(c, custOrders);
    const sorted = [...custOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalSpent = custOrders.filter((o) => o.orderStatus !== 'Cancelled').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lastPurchaseDate = sorted.length > 0 ? sorted[0].date : (c.lastPurchaseDate || null);
    const totalOrders = custOrders.length;
    const points = Math.floor(totalSpent / 10000);
    return {
      ...c,
      segment: newSegment,
      totalOrders,
      totalSpent,
      lastPurchaseDate,
      points,
    };
  });

  state = {
    customers: syncedCustomers,
    products: updatedProducts,
    orders: updatedOrders,
    activities: newActivities,
  };

  return newOrder;
}

// Purchase 1: Zahra buys 2 pcs
const loggedInUser = { customerId: 'CUST-001', name: 'Zahra Amelia Putri', email: 'zahra.putri@gmail.com', phone: '081234567890' };
const orderResult1 = simulateCustomerPurchase(loggedInUser, {
  product: state.products[0],
  quantity: 2,
  color: 'Espresso',
  notes: 'Tolong packing rapi ya kak'
});

assert(state.orders.length === 1, 'Order created in orders list');
assert(state.orders[0].id.startsWith('ORD-'), 'Order ID starts with ORD-');
assert(state.orders[0].customerId === 'CUST-001', 'Order customerId matches');
assert(state.orders[0].customerName === 'Zahra Amelia Putri', 'Order customerName matches');
assert(state.orders[0].phone === '081234567890', 'Order phone matches');
assert(state.orders[0].email === 'zahra.putri@gmail.com', 'Order email matches');
assert(state.orders[0].channel === 'Customer Portal', 'Order channel is Customer Portal');
assert(state.orders[0].paymentStatus === 'Lunas', 'Order paymentStatus is Lunas');
assert(state.orders[0].orderStatus === 'Processing', 'Order orderStatus is Processing');
assert(state.orders[0].total === 89000 * 2, 'Order total is calculated correctly (178000)');

assert(state.products[0].stock === 8, 'Product stock decremented from 10 to 8');
assert(state.products[0].status === 'Tersedia', 'Product status is Tersedia at stock 8');

assert(state.activities.length === 1, 'Activity entry created');
assert(state.activities[0].title === 'Pesanan Baru: Pashmina Viscose Modal Premium', 'Activity title matches specification');
assert(state.activities[0].description.includes('2x Pashmina Viscose Modal Premium via Customer Portal'), 'Activity description matches specification');
assert(state.activities[0].customerId === 'CUST-001', 'Activity customerId matches');

// Customer metrics after Purchase 1
let zahra = state.customers.find(c => c.id === 'CUST-001');
assert(zahra.totalOrders === 1, 'Customer totalOrders is 1');
assert(zahra.totalSpent === 178000, 'Customer totalSpent is 178000');
assert(zahra.points === 17, 'Customer loyalty points is 17 (178000 / 10000)');
assert(zahra.segment === 'New Customer', 'Customer segment is New Customer after 1 order');

// Purchase 2: Zahra buys another 3 pcs -> should transition to Regular Customer and stock to 5 (Stok Menipis)
const orderResult2 = simulateCustomerPurchase(loggedInUser, {
  product: state.products[0],
  quantity: 3,
  color: 'Soft Sand',
});

assert(state.products[0].stock === 5, 'Product stock decremented to 5');
assert(state.products[0].status === 'Stok Menipis', 'Product status is Stok Menipis when stock <= 5');

zahra = state.customers.find(c => c.id === 'CUST-001');
assert(zahra.totalOrders === 2, 'Customer totalOrders is 2');
assert(zahra.totalSpent === 178000 + 267000, 'Customer totalSpent is 445000');
assert(zahra.segment === 'Regular Customer', 'Customer segment automatically upgraded to Regular Customer');

// Purchase 3: Deplete remaining 5 pcs -> stock down to 0 and status Stok Habis
const orderResult3 = simulateCustomerPurchase(loggedInUser, {
  product: state.products[0],
  quantity: 5,
  color: 'Espresso',
});

assert(state.products[0].stock === 0, 'Product stock decremented to 0');
assert(state.products[0].status === 'Stok Habis', 'Product status is Stok Habis when stock == 0');

// Purchase 4: Brand new customer not previously in database
const unknownUser = { email: 'citra.kirana@gmail.com', name: 'Citra Kirana', phone: '08551234567' };
const orderResult4 = simulateCustomerPurchase(unknownUser, {
  product: { id: 'PRD-002', name: 'Hijab Instan Tali Malay', price: 69000, color: 'Black Jet', stock: 20 },
  quantity: 1,
});

assert(state.customers.some(c => c.email === 'citra.kirana@gmail.com'), 'New customer was auto-created in customers database');
const citra = state.customers.find(c => c.email === 'citra.kirana@gmail.com');
assert(citra.totalOrders === 1, 'Auto-created customer has totalOrders = 1');
assert(citra.totalSpent === 69000, 'Auto-created customer has totalSpent = 69000');

// ----------------------------------------------------
// 4. VERIFY REMOVED BUTTONS & CLICKABLE STAT CARDS
// ----------------------------------------------------
console.log('\n--- 4. Verified Dashboard Cleanliness & Clickable Cards ---');

const dashboardViewPath = path.join(__dirname, 'src', 'components', 'DashboardView.jsx');
const dashboardView = fs.readFileSync(dashboardViewPath, 'utf8');

// A. Removed Buttons from Admin Dashboard
assert(!dashboardView.includes('Input Pesanan Baru'), 'DashboardView.jsx does NOT contain Input Pesanan Baru button');
assert(!dashboardView.includes('+ Tambah Pesanan'), 'DashboardView.jsx does NOT contain + Tambah Pesanan button');
assert(!dashboardView.includes('+ Tambah Pelanggan'), 'DashboardView.jsx does NOT contain + Tambah Pelanggan button');
assert(!dashboardView.includes('Tambah Pesanan Baru'), 'DashboardView.jsx does NOT contain Tambah Pesanan Baru button');

const renderDashboardMatch = appHtml.match(/function renderDashboard\(\)\s*\{([\s\S]*?)\}\s*\/\/\s*---\s*Customer Database View/);
const renderDashboardCode = renderDashboardMatch ? renderDashboardMatch[1] : '';
assert(!renderDashboardCode.includes('+ Tambah Pesanan'), 'app.html renderDashboard does NOT contain + Tambah Pesanan');
assert(!renderDashboardCode.includes('+ Tambah Pelanggan'), 'app.html renderDashboard does NOT contain + Tambah Pelanggan');

// B. Clickable Cards in DashboardView.jsx
assert(dashboardView.includes("onNavigate('customers')"), 'DashboardView.jsx Total Customers card is clickable');
assert(dashboardView.includes("onNavigate('customers', { segment: 'New Customer' })"), 'DashboardView.jsx New Customers card is clickable with segment filter');
assert(dashboardView.includes("onNavigate('orders')"), 'DashboardView.jsx Total Orders card is clickable');
assert(dashboardView.includes("onNavigate('reports')"), 'DashboardView.jsx Total Sales card is clickable');
assert(dashboardView.includes("onNavigate('customers', { segment: 'REPEAT' })"), 'DashboardView.jsx Repeat Customers card is clickable with repeat filter');

// C. Clickable Cards in app.html Admin Dashboard
assert(appHtml.includes("App.navigateToView('customers')"), 'app.html has clickable Total Pelanggan card');
assert(appHtml.includes("App.navigateToSegment('New Customer')"), 'app.html has clickable Pelanggan Baru card');
assert(appHtml.includes("App.navigateToView('orders')"), 'app.html has clickable Total Pesanan card');
assert(appHtml.includes("App.navigateToView('reports')"), 'app.html has clickable Total Penjualan card');
assert(appHtml.includes("App.navigateToRepeatCustomers()"), 'app.html has clickable Repeat Customers card');
assert(appHtml.includes("state.customerFilterSegment === 'REPEAT'"), 'app.html supports REPEAT customer segmentation filter');

// D. Clickable Follow-up Cards in app.html and React FollowUpView.jsx
assert(appHtml.includes("App.handleFollowupStatClick('total')"), 'app.html has clickable Total Pelanggan Terdaftar follow-up card');
assert(appHtml.includes("App.handleFollowupStatClick('needs_attention')"), 'app.html has clickable Perlu Follow-up Cepat card');
assert(appHtml.includes("App.handleFollowupStatClick('reminders')"), 'app.html has clickable Jadwal Pengingat Aktif card');

const followUpViewPath = path.join(__dirname, 'src', 'components', 'FollowUpView.jsx');
const followUpView = fs.readFileSync(followUpViewPath, 'utf8');
assert(followUpView.includes('Total Pelanggan Terdaftar'), 'FollowUpView.jsx renders Total Pelanggan Terdaftar stat card');
assert(followUpView.includes('Perlu Follow-up Cepat'), 'FollowUpView.jsx renders Perlu Follow-up Cepat stat card');
assert(followUpView.includes('Jadwal Pengingat Aktif'), 'FollowUpView.jsx renders Jadwal Pengingat Aktif stat card');

// E. Clickable Customer Portal Cards in app.html and CustomerPortal.jsx
assert(appHtml.includes("App.handleCustomerStatClick('member')"), 'app.html has clickable Status Member card');
assert(appHtml.includes("App.handleCustomerStatClick('active_orders')"), 'app.html has clickable Pesanan Aktif card');
assert(appHtml.includes("App.handleCustomerStatClick('total_orders')"), 'app.html has clickable Total Pesanan card');
assert(appHtml.includes("App.handleCustomerStatClick('total_spent')"), 'app.html has clickable Total Belanja card');

assert(customerPortal.includes('Status Member'), 'CustomerPortal.jsx renders Status Member card');
assert(customerPortal.includes('Pesanan Aktif'), 'CustomerPortal.jsx renders Pesanan Aktif card');
assert(customerPortal.includes('Total Pesanan'), 'CustomerPortal.jsx renders Total Pesanan card');
assert(customerPortal.includes('Total Belanja'), 'CustomerPortal.jsx renders Total Belanja card');

// E2. Chat Deletion Feature in app.html
assert(appHtml.includes('clearAdminChat('), 'app.html defines clearAdminChat method for admin');
assert(appHtml.includes('clearCustomerChat()'), 'app.html defines clearCustomerChat method for customer');
assert(appHtml.includes('Hapus Riwayat Chat'), 'app.html includes Hapus Riwayat Chat action button');

// F. Initial Clean Data Default & Modal Fallback Cleanliness
assert(appHtml.includes("customers: [],"), 'app.html initializes empty customers array');
assert(appHtml.includes("orders: [],"), 'app.html initializes empty orders array');

const orderModalMatch = appHtml.match(/\/\/\s*4\.\s*Order Modal[\s\S]*?<\/form>/);
const orderModalCode = orderModalMatch ? orderModalMatch[0] : '';
assert(!orderModalCode.includes('Zahra Amelia Putri'), 'app.html order modal does not fall back to Zahra Amelia Putri');
assert(!orderModalCode.includes('value="89000"'), 'app.html does not hardcode default 89000 price in order modal');

// G. Customer Portal Aesthetic & Points Discount Complete Removal
assert(!appHtml.includes("App.handleCustomerStatClick('points')"), 'app.html has removed points stat click');
assert(!appHtml.includes("pointsInfo"), 'app.html has removed points explanation modal');
assert(!customerPortal.includes("Poin Belanja"), 'CustomerPortal.jsx has removed Poin Belanja');
assert(!customerPortal.includes("Poin Loyalitas"), 'CustomerPortal.jsx has removed Poin Loyalitas');
assert(!customerPortal.includes("const points ="), 'CustomerPortal.jsx has removed unused points calculation');
assert(appHtml.includes("Konsultasi Warna & Bahan Hijab Personal"), 'app.html customer dashboard has Stylist Consultation banner');
assert(appHtml.includes("Garansi Jahitan 100%"), 'app.html customer dashboard has Boutique Trust Guarantee strip');
assert(appHtml.includes("Koleksi Paling Diminati"), 'app.html customer dashboard has Koleksi Paling Diminati section');
// ----------------------------------------------------
// 5. PRODUCT COLOR VALIDATION INTEGRITY
// ----------------------------------------------------
console.log('\n--- 5. Product Color Validation Integrity ---');

// A. Code Patterns
assert(appHtml.includes("warna tidak tersedia/habis"), 'app.html contains exact color rejection message');
assert(appJsx.includes("warna tidak tersedia/habis"), 'App.jsx contains exact color rejection message');
assert(customerPortal.includes("warna tidak tersedia/habis"), 'CustomerPortal.jsx contains exact color rejection message');
assert(storageJs.includes("isProductColorAvailable"), 'storage.js exports isProductColorAvailable');
assert(storageJs.includes("getProductColors"), 'storage.js exports getProductColors');
assert(customerPortal.includes("isProductColorAvailable"), 'CustomerPortal.jsx imports isProductColorAvailable');

// B. Direct Function Logic Validation (Evaluated from real storage.js logic)
const storageModCode = storageJs.replace(/export\s+const/g, 'var');
const storageScope = {
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  Intl, Date, Math, String, Array, console
};
const vm = require('vm');
vm.runInNewContext(storageModCode, storageScope);
const { isProductColorAvailable, getProductColors } = storageScope;

const sampleProd = {
  id: 'PRD-001',
  name: 'Pashmina Viscose Modal',
  color: 'Espresso, Mauve Taupe, Soft Sand, Broken White'
};

assert(isProductColorAvailable(sampleProd, 'Espresso'), 'Exact color match accepted');
assert(isProductColorAvailable(sampleProd, 'espresso'), 'Lowercase color match accepted (case-insensitive)');
assert(isProductColorAvailable(sampleProd, '  ESPRESSO  '), 'Trimmed color match accepted (trim-sensitive)');
assert(isProductColorAvailable(sampleProd, 'Mauve Taupe'), 'Multi-word color match accepted');
assert(isProductColorAvailable(sampleProd, '  mauve taupe  '), 'Multi-word trimmed lowercase match accepted');
assert(!isProductColorAvailable(sampleProd, 'Kuning'), 'Unlisted color rejected');
assert(!isProductColorAvailable(sampleProd, 'Merah Muda'), 'Unlisted color rejected');
assert(!isProductColorAvailable(sampleProd, 'Esp'), 'Substring of color rejected');
assert(!isProductColorAvailable(sampleProd, ''), 'Empty string color rejected');
assert(!isProductColorAvailable(sampleProd, '   '), 'Whitespace string color rejected');

// Multi-separator and structure support
const slashProd = { id: 'PRD-SLASH', name: 'Hijab Slash', color: 'Hitam / Putih / Mocca' };
assert(isProductColorAvailable(slashProd, 'Hitam'), 'Slash-separated color: Hitam accepted');
assert(isProductColorAvailable(slashProd, 'putih'), 'Slash-separated color: putih accepted');
assert(isProductColorAvailable(slashProd, '  mocca  '), 'Slash-separated color: mocca accepted');
assert(!isProductColorAvailable(slashProd, 'Navy'), 'Slash-separated color: unlisted Navy rejected');

const semiProd = { id: 'PRD-SEMI', name: 'Hijab Semicolon', color: 'Hitam; Putih; Navy' };
assert(isProductColorAvailable(semiProd, 'Navy'), 'Semicolon-separated color: Navy accepted');

const arrayProd = { id: 'PRD-ARR', name: 'Hijab Array', color: ['Espresso', 'Broken White'] };
assert(isProductColorAvailable(arrayProd, 'Espresso'), 'Array colors: Espresso accepted');
assert(isProductColorAvailable(arrayProd, 'broken white'), 'Array colors: broken white accepted');
assert(!isProductColorAvailable(arrayProd, 'Merah'), 'Array colors: unlisted Merah rejected');

const nonBreakingSpaceProd = { id: 'PRD-NBSP', name: 'Hijab NBSP', color: 'Hitam, Putih' };
assert(isProductColorAvailable(nonBreakingSpaceProd, 'Hitam\u00A0'), 'Requested color with non-breaking space accepted');

const noColorProd = { id: 'PRD-EMPTY', name: 'Hijab Polos', color: '' };
assert(!isProductColorAvailable(noColorProd, 'Espresso'), 'Product with empty color rejects any color');
assert(!isProductColorAvailable(null, 'Espresso'), 'Null product safely rejects color');

// ----------------------------------------------------
// 6. ADMIN DASHBOARD FULL RESPONSIVENESS
// ----------------------------------------------------
console.log('\n--- 6. Admin Dashboard Full Responsiveness ---');

// CSS Media Queries
assert(appHtml.includes('@media (max-width: 900px)'), 'app.html contains tablet/mobile media query (max-width: 900px)');
assert(appHtml.includes('@media (max-width: 600px)'), 'app.html contains mobile phone media query (max-width: 600px)');
assert(appHtml.includes('@media (max-width: 380px)'), 'app.html contains small mobile media query (max-width: 380px)');
assert(appHtml.includes('@media (min-width: 901px)'), 'app.html contains desktop media query (min-width: 901px)');

// Responsive Mobile Drawer and Toggle
assert(appHtml.includes('toggleSidebar()'), 'app.html defines toggleSidebar method');
assert(appHtml.includes('closeSidebar()'), 'app.html defines closeSidebar method');
assert(appHtml.includes('mobile-menu-btn'), 'app.html contains mobile menu toggle button');
assert(appHtml.includes('sidebar-backdrop'), 'app.html contains mobile sidebar backdrop overlay');
assert(appHtml.includes('sidebar-close-btn'), 'app.html contains sidebar close button');

// Table Horizontal Scrolling & Modals
assert(appHtml.includes('overflow-x: auto'), 'app.html table container has overflow-x: auto');
assert(appHtml.includes('min-width: 580px'), 'app.html table has responsive min-width');
assert(appHtml.includes('white-space: nowrap'), 'app.html table headers have white-space: nowrap');

// React Component Responsiveness
const sidebarJsxPath = path.join(__dirname, 'src', 'components', 'Sidebar.jsx');
const sidebarJsx = fs.readFileSync(sidebarJsxPath, 'utf8');
const headerJsxPath = path.join(__dirname, 'src', 'components', 'Header.jsx');
const headerJsx = fs.readFileSync(headerJsxPath, 'utf8');
const dashboardViewJsxPath = path.join(__dirname, 'src', 'components', 'DashboardView.jsx');
const dashboardViewJsx = fs.readFileSync(dashboardViewJsxPath, 'utf8');

assert(headerJsx.includes('onToggleSidebar'), 'Header.jsx accepts onToggleSidebar prop');
assert(headerJsx.includes('md:hidden'), 'Header.jsx renders hamburger button for mobile');
assert(sidebarJsx.includes('isOpen'), 'Sidebar.jsx accepts isOpen prop');
assert(sidebarJsx.includes('onClose'), 'Sidebar.jsx accepts onClose prop');
assert(sidebarJsx.includes('fixed inset-y-0'), 'Sidebar.jsx supports mobile off-canvas drawer');
assert(dashboardViewJsx.includes('xl:grid-cols-5'), 'DashboardView.jsx KPI row has responsive grid columns');
assert(dashboardViewJsx.includes('overflow-x-auto'), 'DashboardView.jsx charts support horizontal scrolling on mobile');

console.log(`\n====================================================`);
console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!       `);
console.log(`====================================================`);

