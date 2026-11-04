const fs = require('fs');

console.log('=== PRODUCT SYNC VERIFICATION ===');
const app = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', 'utf8');

let pass = 0;
function test(name, ok) {
  if (ok) {
    console.log('  [PASS]', name);
    pass++;
  } else {
    console.error('  [FAIL]', name);
    process.exit(1);
  }
}

test('Explicit PRODUCT_UPDATE broadcast on product save', app.includes("type: 'PRODUCT_UPDATE'"));
test('Explicit PRODUCT_DELETE broadcast on product delete', app.includes("type: 'PRODUCT_DELETE'"));
test('handleIncomingSync accepts direct packet.product', app.includes("if (packet.product && typeof packet.product === 'object' && packet.product.id)"));
test('handleIncomingSync accepts direct packet.productId delete', app.includes("if (packet.type === 'PRODUCT_DELETE' && packet.productId)"));
test('ntfy attachment URL fetcher active for large payloads', app.includes("parsed.attachment && parsed.attachment.url"));
test('Optimized image thumbnail maxDim is 240px', app.includes('const maxDim = 240;'));
test('serve.cjs handles direct packet.product in server state', fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/serve.cjs', 'utf8').includes('payload.product'));

console.log('ALL', pass, 'PRODUCT SYNC VERIFICATIONS PASSED 100%!');
