const fs = require('fs');

// --- 1. Modify app.html ---
let app = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', 'utf8');

// Target A: Admin topbar sync buttons
const adminSyncButtons = `            <button type="button" class="btn btn-outline" onclick="App.openSyncModal()" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 11px; border-radius: 999px; background: #FAF8F5; border: 1px solid var(--border);" title="Pengaturan Sinkronisasi Real-Time Laptop & HP">
              <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #059669;"></span>
              <span style="font-weight: 600; color: #059669;">🟢 Sinkron Real-Time Aktif (Laptop ↔ HP)</span>
            </button>
            <button type="button" class="btn btn-outline" onclick="App.syncAllWithCloud()" style="padding: 6px 10px; font-size: 11px; border-radius: 8px;" title="Sinkronkan data sekarang">🔄 Sinkronkan Sekarang</button>`;

if (!app.includes(adminSyncButtons)) {
  console.error('Target A adminSyncButtons not found!');
  process.exit(1);
}
app = app.replace(adminSyncButtons, '');

// Target B: Customer Portal topbar sync buttons
const portalSyncButtons = `              <button type="button" class="btn btn-outline" onclick="App.openSyncModal()" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; font-size: 11px; border-radius: 999px; background: #FAF8F5; border: 1px solid var(--border);" title="Status Sinkronisasi Multi-Device Laptop & HP">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: #059669; display: inline-block;"></span>
                <span style="font-weight: 600; color: #059669;">🟢 Sinkron Real-Time Aktif (Laptop ↔ HP)</span>
              </button>
              <button type="button" class="btn btn-outline" onclick="App.syncAllWithCloud()" style="padding: 4px 8px; font-size: 11px; border-radius: 8px;" title="Sinkronkan data sekarang">🔄 Sinkronkan Sekarang</button>`;

if (!app.includes(portalSyncButtons)) {
  console.error('Target B portalSyncButtons not found!');
  process.exit(1);
}
app = app.replace(portalSyncButtons, '');

// Target C: Settings sync card
const settingsSyncCard = `          <!-- Sinkronisasi Real-Time Multi-Device (Laptop ↔ HP) -->
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 8px;">
              <h3 style="font-size: 16px; font-weight: bold;">Sinkronisasi Real-Time Multi-Device (Laptop ↔ HP)</h3>
              <span class="badge badge-success">🟢 Sinkron Real-Time Aktif (Laptop ↔ HP)</span>
            </div>
            <p style="font-size: 11px; color: #777; margin-bottom: 16px;">Semua data pesanan pelanggan, katalog produk hijab, aktivitas butik, dan percakapan chat tersinkron otomatis secara instan antara Laptop Admin dan HP Pelanggan/Admin tanpa konfigurasi rumit.</p>
            <div class="form-group">
              <label class="form-label">Kode Saluran Sinkron (Sync Room Topic)</label>
              <div style="display: flex; gap: 8px; max-width: 500px;">
                <input id="set-sync-room" class="form-control" value="\${escapeHtml(App.getSyncRoom())}" placeholder="bynvdila_crm_sync_channel">
                <button type="button" class="btn btn-primary" onclick="App.saveSyncRoomFromSettings()">Simpan Room</button>
              </div>
              <p style="font-size: 10.5px; color: #777; margin-top: 4px;">Ubah jika Anda ingin menggunakan channel khusus butik Anda sendiri.</p>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
              <button type="button" class="btn btn-outline" onclick="App.openSyncModal()">📱 Buka Dialog Sinkronisasi & Link HP</button>
              <button type="button" class="btn btn-secondary" onclick="App.syncAllWithCloud()">🔄 Sinkronkan Sekarang</button>
            </div>
          </div>`;

if (!app.includes(settingsSyncCard)) {
  console.error('Target C settingsSyncCard not found!');
  process.exit(1);
}
app = app.replace(settingsSyncCard, '');

// Target D: showSyncToast made completely silent
const oldToast = `      showSyncToast(msg) {
        try {
          if (typeof document === 'undefined') return;
          const old = document.getElementById('sync-toast-box');
          if (old) old.remove();
          const toast = document.createElement('div');
          toast.id = 'sync-toast-box';
          toast.className = 'sync-toast';
          toast.innerHTML = \`<span>🔄</span><span>\${escapeHtml(msg)}</span>\`;
          document.body.appendChild(toast);
          setTimeout(() => { if (toast && toast.parentNode) toast.remove(); }, 3200);
        } catch(e) {}
      },`;

const newToast = `      showSyncToast(msg) {
        // Silent background sync: system synchronizes directly without visual popups
      },`;

if (!app.includes(oldToast)) {
  console.error('Target D oldToast not found!');
  process.exit(1);
}
app = app.replace(oldToast, newToast);

fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', app, 'utf8');
fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html', app, 'utf8');
console.log('app.html and index.html cleaned successfully!');

// --- 2. Modify src/components/Header.jsx ---
let header = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/src/components/Header.jsx', 'utf8');
const headerSyncBadge = `          {/* Real-time Cross-Device Sync Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-emerald-700">🟢 Sinkron Real-Time Aktif (Laptop ↔ HP)</span>
          </div>`;

if (header.includes(headerSyncBadge)) {
  header = header.replace(headerSyncBadge, '');
  fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/src/components/Header.jsx', header, 'utf8');
  console.log('Header.jsx cleaned!');
}

// --- 3. Modify src/components/SettingsView.jsx ---
let settings = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/src/components/SettingsView.jsx', 'utf8');
const settingsSyncSection = `      {/* Real-time Multi-Device Sync Card */}
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div>
            <h3 className="font-serif text-base font-semibold text-stone-900">
              Sinkronisasi Real-Time Multi-Device (Laptop ↔ HP)
            </h3>
            <p className="text-xs text-stone-500">
              Semua aktivitas pemesanan, produk baru, dan chat langsung terhubung otomatis
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            🟢 Sinkron Real-Time Aktif (Laptop ↔ HP)
          </span>
        </div>
        <p className="text-xs text-stone-600">
          Kode saluran aktif: <code className="px-2 py-0.5 rounded bg-stone-100 font-mono text-stone-800">bynvdila_crm_sync_channel</code>. Buka butik di HP (Chrome/Safari) untuk langsung melihat pembaruan data secara langsung.
        </p>
      </div>`;

if (settings.includes(settingsSyncSection)) {
  settings = settings.replace(settingsSyncSection, '');
  fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/src/components/SettingsView.jsx', settings, 'utf8');
  console.log('SettingsView.jsx cleaned!');
}
