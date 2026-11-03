const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'app.html'), path.join(distDir, 'app.html'));
if (fs.existsSync(path.join(__dirname, 'supabase-schema.sql'))) {
  fs.copyFileSync(path.join(__dirname, 'supabase-schema.sql'), path.join(distDir, 'supabase-schema.sql'));
}
console.log('✅ Build dist berhasil: index.html & app.html siap disajikan.');
