const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('   ADVERSARIAL REVIEW VERIFICATION SUITE            ');
console.log('====================================================');

const appHtmlPath = path.join(__dirname, 'app.html');
const indexHtmlPath = path.join(__dirname, 'index.html');
const appHtml = fs.readFileSync(appHtmlPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Standalone Files 100% Identical
assert(appHtml === indexHtml, 'app.html and index.html must be 100% binary identical');
console.log('  [PASS] app.html and index.html are 100% identical');

// 2. Customer Portal Desktop & Laptop Base CSS
assert(appHtml.includes('.portal-ribbon {'), 'portal-ribbon base CSS defined');
assert(appHtml.includes('.portal-header {'), 'portal-header base CSS defined');
assert(appHtml.includes('.portal-nav {'), 'portal-nav base CSS defined');
assert(appHtml.includes('.portal-main {'), 'portal-main base CSS defined');
console.log('  [PASS] Customer Portal base CSS classes defined for desktop & laptop');

// 3. Grid 5 Laptop Cascade Order Bug Fixed
assert(!appHtml.includes('@media (max-width: 1200px) {\n      .grid-5 { grid-template-columns: repeat(3, minmax(0, 1fr)); }'), 'Inverted 1200px 3-column override on grid-5 is removed');
assert(appHtml.includes('@media (min-width: 901px)'), 'Min-width 901px desktop media query present');
console.log('  [PASS] Laptop 5-column layout preserved with no awkward 3-column gap');

// 4. Anti-Blowout CSS on Cards and Grids
assert(appHtml.includes('min-width: 0'), 'Cards and grids protect against min-width auto blowout');
console.log('  [PASS] Anti-blowout min-width: 0 protection present');

// 5. KPI Number Formatting & Ellipsis
assert(appHtml.includes('white-space: nowrap') && appHtml.includes('text-overflow: ellipsis'), 'KPI values protected from mid-number wrapping');
console.log('  [PASS] KPI values protected from mid-digit line breaking');

// 6. Safe Color Button Handling & Helper
assert(appHtml.includes('selectPurchaseColor(col)'), 'App defines selectPurchaseColor method');
assert(appHtml.includes('App.selectPurchaseColor'), 'Color buttons call App.selectPurchaseColor safely');
console.log('  [PASS] Safe color selection button handler implemented');

// 7. Multi-delimiter in Array Variants
(async () => {
const storageJsPath = path.join(__dirname, 'src', 'utils', 'storage.js');
const storageJs = await import('file:///' + storageJsPath.replace(/\\/g, '/'));
const prodWithArrayDelim = {
  id: 'PRD-TEST-DELIM',
  name: 'Viscose Hijab Multi Delim',
  color: ['Hitam, Mocca', 'Navy / Sage', 'Dusty; Rose']
};
const extractedColors = storageJs.getProductColors(prodWithArrayDelim);
assert(extractedColors.includes('Hitam'), 'Array containing comma splits Hitam');
assert(extractedColors.includes('Mocca'), 'Array containing comma splits Mocca');
assert(extractedColors.includes('Navy'), 'Array containing slash splits Navy');
assert(extractedColors.includes('Sage'), 'Array containing slash splits Sage');
assert(extractedColors.includes('Dusty'), 'Array containing semicolon splits Dusty');
assert(extractedColors.includes('Rose'), 'Array containing semicolon splits Rose');
assert(storageJs.isProductColorAvailable(prodWithArrayDelim, 'Sage'), 'isProductColorAvailable matches Sage');
assert(storageJs.isProductColorAvailable(prodWithArrayDelim, 'mocca'), 'isProductColorAvailable matches lowercase mocca');
assert(!storageJs.isProductColorAvailable(prodWithArrayDelim, 'Hijau'), 'isProductColorAvailable rejects unlisted color');
console.log('  [PASS] getProductColors handles array items with multi-delimiters');
})();

// 8. Modular React DashboardView Laptop & Mobile Responsiveness
const dashboardJsxPath = path.join(__dirname, 'src', 'components', 'DashboardView.jsx');
const dashboardJsx = fs.readFileSync(dashboardJsxPath, 'utf8');
assert(dashboardJsx.includes('lg:grid-cols-5'), 'DashboardView.jsx has 5 columns on laptop (lg)');
assert(dashboardJsx.includes('col-span-2 sm:col-span-2 lg:col-span-1'), 'Repeat customers card spans cleanly on mobile/tablet');
console.log('  [PASS] Modular React DashboardView fluid across mobile, tablet, and laptop');

// 9. OrderModal Color Validation
const orderModalJsxPath = path.join(__dirname, 'src', 'components', 'OrderModal.jsx');
const orderModalJsx = fs.readFileSync(orderModalJsxPath, 'utf8');
assert(orderModalJsx.includes('getProductColors(prod).length > 0 && !isProductColorAvailable(prod, item.color)'), 'OrderModal strictly validates color availability');
console.log('  [PASS] OrderModal color validation active');

console.log('\n====================================================');
console.log('   ALL ADVERSARIAL REVIEW TESTS PASSED!             ');
console.log('====================================================');
