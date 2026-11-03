/**
 * SUPABASE DATA SYNC FOR BY.NVDILA
 * Mengunggah data awal (produk, akun admin, pengaturan toko) ke database Supabase
 * Jalankan: node sync-local-to-supabase.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.log('⚠️  Kredensial Supabase belum diisi pada file .env!');
  console.log('   Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY terlebih dahulu.');
  process.exit(0);
}

function upsert(table, data) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(`${supabaseUrl}/rest/v1/${table}`);
      const payload = JSON.stringify(data);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let resData = '';
        res.on('data', chunk => { resData += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(resData || '[]'));
          } else {
            reject(new Error(`[${res.statusCode}] ${resData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function sync() {
  console.log('====================================================');
  console.log('   SINKRONISASI DATA AWAL KE SUPABASE BY.NVDILA     ');
  console.log('====================================================\n');

  try {
    // 1. Sinkronisasi Pengaturan Toko
    console.log('📦 Mengunggah Pengaturan Toko by.nvdila...');
    await upsert('store_settings', [{
      id: 'default',
      brand_name: 'by.nvdila',
      tagline: 'Sentuhan Elegan & Modest Fashion Terbaik',
      instagram: '@by.nvdila',
      whatsapp: '081234567890',
      bank_name: 'Bank Central Asia (BCA)',
      bank_number: '123-456-7890',
      bank_holder: 'by.nvdila Boutique'
    }]);
    console.log('  [OK] Pengaturan Toko berhasil tersimpan di Supabase.\n');

    // 2. Sinkronisasi Akun Admin Resmi Sella
    console.log('👤 Mengunggah Akun Admin Resmi...');
    await upsert('users', [{
      email: 'sellanrhrdni123@gmail.com',
      password_hash: 'admin123',
      name: 'Sella Nurhardiani',
      role: 'admin',
      phone: '081234567890',
      address: 'Jakarta, Indonesia'
    }]);
    console.log('  [OK] Akun Admin Resmi berhasil tersimpan di Supabase.\n');

    console.log('====================================================');
    console.log('✅ Sinkronisasi Berhasil Selesai!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Gagal sinkronisasi:', err.message);
  }
}

sync();
