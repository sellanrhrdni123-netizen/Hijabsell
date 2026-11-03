const fs = require('fs');
const app = fs.readFileSync('app.html', 'utf8');

// Extract getProductColors and isProductColorAvailable from app.html
const fnStr = app.substring(app.indexOf('function getProductColors'), app.indexOf('function loadSampleData'));
eval(fnStr);

console.log('Test 1: "Hitam (Jet Black), Soft Sand"');
const p1 = { color: 'Hitam (Jet Black), Soft Sand' };
console.log('Colors:', getProductColors(p1));
console.log('is Hitam (Jet Black) available?', isProductColorAvailable(p1, 'Hitam (Jet Black)'));
console.log('is hitam (jet black) available?', isProductColorAvailable(p1, 'hitam (jet black)'));
console.log('is Pink available?', isProductColorAvailable(p1, 'Pink'));

console.log('\nTest 2: Slash delimiter "Hitam / Putih / Mocca"');
const p2 = { color: 'Hitam / Putih / Mocca' };
console.log('Colors:', getProductColors(p2));
console.log('is Putih available?', isProductColorAvailable(p2, 'Putih'));
console.log('is Navy available?', isProductColorAvailable(p2, 'Navy'));

console.log('\nTest 3: Array of colors ["Espresso", "Mauve Taupe"]');
const p3 = { color: ['Espresso', 'Mauve Taupe'] };
console.log('Colors:', getProductColors(p3));
console.log('is Espresso available?', isProductColorAvailable(p3, 'Espresso'));

console.log('\nTest 4: Semicolon delimiter "Dusty Pink; Army; Mustard"');
const p4 = { color: 'Dusty Pink; Army; Mustard' };
console.log('Colors:', getProductColors(p4));
console.log('is Army available?', isProductColorAvailable(p4, 'Army'));
console.log('is army available?', isProductColorAvailable(p4, 'army'));

console.log('\nTest 5: Empty color product');
const p5 = { color: '' };
console.log('Colors:', getProductColors(p5));
console.log('is anything available?', isProductColorAvailable(p5, 'Hitam'));
