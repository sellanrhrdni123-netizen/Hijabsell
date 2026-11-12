const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('====================================================================');
console.log('   WHATSAPP DIRECT CHAT & AUTOMATED MESSAGES TEST SUITE             ');
console.log('====================================================================\n');

const repoDir = 'C:\\Users\\sella\\.gemini\\antigravity\\scratch\\by-nvdila-crm';
const indexHtml = fs.readFileSync(path.join(repoDir, 'index.html'));
const appHtml = fs.readFileSync(path.join(repoDir, 'app.html'));

// TEST 1: Binary Identity
console.log('--- TEST 1: Binary Identity ---');
assert(indexHtml.equals(appHtml), 'index.html and app.html must be 100% binary identical');
console.log('  [PASS] index.html and app.html are 100% binary identical');

// TEST 2: Script Execution & WhatsApp Method Availability
console.log('\n--- TEST 2: Script Execution & WhatsApp Method Availability ---');
const scriptMatch = indexHtml.toString('utf8').match(/<script>([\s\S]*?)<\/script>/i);
assert(scriptMatch, 'Could not find <script> in index.html');

let alerts = [];
let windowOpens = [];
const domElements = {
  'app': { innerHTML: '' },
  'wa-modal-text': { value: '' }
};

const sandbox = {
  console: { log() {}, warn() {}, error() {} },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  location: { protocol: 'https:', hostname: 'hijabsell.vercel.app', port: '' },
  document: {
    getElementById(eid) {
      if (!domElements[eid]) {
        domElements[eid] = { value: '', focus() {}, style: {} };
      }
      return domElements[eid];
    },
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, appendChild() {}, setAttribute() {}, click() {} }),
    body: { appendChild() {} },
    addEventListener: () => {}
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    clipboard: { writeText: () => Promise.resolve() }
  },
  fetch: () => Promise.resolve({ json: () => Promise.resolve({ ok: true }), text: () => Promise.resolve('ok') }),
  confirm: () => true,
  alert: (msg) => { alerts.push(msg); },
  setTimeout: (fn) => fn(),
  setInterval: () => 1,
  Intl, Date, Math, String, Number, Array, Object, JSON, Set, parseInt, parseFloat, isNaN, encodeURI, encodeURIComponent
};
sandbox.window = sandbox;
sandbox.window.open = (url, target) => { windowOpens.push({ url, target }); };

const context = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], context);

assert(typeof context.App.openWhatsApp === 'function', 'App.openWhatsApp must be defined');
assert(typeof context.App.openDirectWhatsApp === 'function', 'App.openDirectWhatsApp must be defined');
assert(typeof context.App.getAutoMessage === 'function', 'App.getAutoMessage must be defined');
assert(typeof context.App.sendOrderWhatsApp === 'function', 'App.sendOrderWhatsApp must be defined');
assert(typeof context.App.openWhatsAppTemplateModal === 'function', 'App.openWhatsAppTemplateModal must be defined');
console.log('  [PASS] All WhatsApp methods exist on global App object');

// TEST 3: Phone Normalization
console.log('\n--- TEST 3: Phone Number Normalization ---');
assert.strictEqual(context.formatCleanPhone('081234567890'), '6281234567890');
assert.strictEqual(context.formatCleanPhone('0819-8765-4321'), '6281987654321');
assert.strictEqual(context.formatCleanPhone('+62 812 3456 7890'), '6281234567890');
assert.strictEqual(context.formatCleanPhone('81234567890'), '6281234567890');
assert.strictEqual(context.formatCleanPhone('6281234567890'), '6281234567890');
assert.strictEqual(context.formatCleanPhone(''), '');
console.log('  [PASS] formatCleanPhone handles 08..., +62..., 8..., and symbols cleanly');

// TEST 4: Direct WhatsApp Routing Intent
console.log('\n--- TEST 4: Direct WhatsApp Routing Intent ---');
const desktopDirect = context.getWhatsAppDirectUrl('081234567890', 'Halo Kak!');
assert(desktopDirect.startsWith('https://web.whatsapp.com/send?phone=6281234567890'), 'Desktop must route directly to web.whatsapp.com');
assert(!desktopDirect.includes('wa.me'), 'Desktop must bypass wa.me intermediary page');
console.log('  [PASS] Desktop URL bypasses intermediary page: ' + desktopDirect);

// TEST 5: Automated Message Generation
console.log('\n--- TEST 5: Automated Message Generation ---');
const orderMsg = context.getAutoMessage('order_confirmation', {
  customerName: 'Siti Rahma',
  orderId: 'ORD-TEST-001',
  itemsText: 'Pashmina Viscose Modal Espresso (2x)',
  total: 178000,
  paymentMethod: 'Transfer BCA',
  paymentStatus: 'Lunas',
  orderStatus: 'Processing',
  resi: 'NV-998877'
});

assert(orderMsg.includes('Siti Rahma'), 'Message must include customer name');
assert(orderMsg.includes('ORD-TEST-001'), 'Message must include order ID');
assert(orderMsg.includes('Pashmina Viscose Modal Espresso'), 'Message must include items');
assert(orderMsg.includes('Rp') || orderMsg.includes('178'), 'Message must include total');
assert(orderMsg.includes('NV-998877'), 'Message must include resi');
console.log('  [PASS] order_confirmation template verified:\n' + orderMsg.split('\n').map(l => '    ' + l).join('\n'));

// TEST 6: Shipping & Completed Templates
console.log('\n--- TEST 6: Shipping & Completed Templates ---');
const shipMsg = context.getAutoMessage('order_shipping', { customerName: 'Fatimah', orderId: 'ORD-002', resi: 'JNE-123' });
assert(shipMsg.includes('JNE-123') && shipMsg.includes('dikirimkan'), 'Shipping message must include tracking');
const doneMsg = context.getAutoMessage('order_completed', { customerName: 'Fatimah', orderId: 'ORD-002' });
assert(doneMsg.includes('Selesai'), 'Completed message must include Selesai');
console.log('  [PASS] Shipping and completion templates verified');

// TEST 7: Interactive WhatsApp Template Modal
console.log('\n--- TEST 7: Interactive WhatsApp Template Modal ---');
context.state.data.customers = [{ id: 'CUST-001', name: 'Nabila', phone: '081234567890', segment: 'VIP Customer' }];
context.state.data.orders = [{ id: 'ORD-001', customerId: 'CUST-001', customerName: 'Nabila', phone: '081234567890', total: 150000, orderStatus: 'Processing', items: [{ productName: 'Pashmina Viscose Modal', quantity: 2 }] }];

context.App.openWhatsAppTemplateModal({ customerId: 'CUST-001' });
assert.strictEqual(context.state.activeModal, 'wa_template', 'Modal must be wa_template');
assert.strictEqual(context.state.waModalData.phone, '081234567890', 'Phone must match');
assert(context.state.waModalData.messageText.length > 20, 'Message text must be populated');

// Switch template in modal
context.App.selectWaModalTemplate('followup_promo');
assert.strictEqual(context.state.waModalData.selectedTemplate, 'followup_promo');
assert(context.state.waModalData.messageText.includes('koleksi hijab pashmina viscose modal'));

// Send modal message
context.App.sendWaModalMessage();
assert.strictEqual(context.state.activeModal, null, 'Modal must close on send');
assert(windowOpens.length > 0, 'window.open must be called to open room chat');
assert(windowOpens[0].url.startsWith('https://web.whatsapp.com/send?phone=6281234567890'));
console.log('  [PASS] Interactive WhatsApp Template Modal workflow fully verified');

console.log('\n====================================================================');
console.log('   ALL 7 WHATSAPP & AUTOMATED MESSAGE TESTS PASSED!                 ');
console.log('====================================================================');
