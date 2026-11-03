/**
 * SUPABASE CONNECTION CHECKER FOR BY.NVDILA
 * Jalankan: node test-supabase-connection.cjs [SUPABASE_URL] [SUPABASE_ANON_KEY]
 * atau atur di file .env: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env manual jika ada
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

const args = process.argv.slice(2);
const supabaseUrl = args[0] || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = args[1] || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('====================================================');
console.log('   PEMERIKSAAN KONEKSI DATABASE SUPABASE BY.NVDILA   ');
console.log('====================================================\n');

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.log('⚠️  Kredensial Supabase belum dikonfigurasi!');
  console.log('   Silakan isi kredensial di file .env:');
  console.log('   VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=[ANON-KEY]');
  console.log('\n   Atau jalankan dengan parameter:');
  console.log('   node test-supabase-connection.cjs https://xyz.supabase.co eyJhbGci...');
  console.log('\n====================================================');
  process.exit(0);
}

console.log(`📡 URL Proyek: ${supabaseUrl}`);
console.log(`🔑 Anon Key  : ${supabaseKey.slice(0, 15)}...${supabaseKey.slice(-10)}\n`);

const tablesToCheck = ['users', 'store_settings', 'products', 'customers', 'orders', 'followups', 'chats', 'activities'];

function checkTable(table) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ table, success: true, count: 0, status: res.statusCode });
          } else {
            resolve({ table, success: false, status: res.statusCode, error: data });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ table, success: false, error: err.message });
      });

      req.setTimeout(8000, () => {
        req.destroy();
        resolve({ table, success: false, error: 'Timeout koneksi (8 detik)' });
      });

      req.end();
    } catch (e) {
      resolve({ table, success: false, error: e.message });
    }
  });
}

async function run() {
  console.log('🔍 Memeriksa ketersediaan tabel di Supabase...\n');
  let allSuccess = true;

  for (const t of tablesToCheck) {
    const res = await checkTable(t);
    if (res.success) {
      console.log(`  [OK] Tabel public.${t.padEnd(16)} : Terhubung & Siap digunakan`);
    } else {
      allSuccess = false;
      console.log(`  [FAIL] Tabel public.${t.padEnd(14)} : Gagal diakses (${res.error || res.status})`);
    }
  }

  console.log('\n====================================================');
  if (allSuccess) {
    console.log('✅ SUKSES! Seluruh tabel Supabase by.nvdila terhubung sempurna!');
    console.log('   Aplikasi siap beroperasi penuh secara online.');
  } else {
    console.log('⚠️  Beberapa tabel belum ditemukan di Supabase.');
    console.log('   Pastikan Anda telah menjalankan isi file "supabase-schema.sql"');
    console.log('   di menu SQL Editor pada Dashboard Supabase Anda.');
  }
  console.log('====================================================\n');
}

run();
