const fs = require('fs');
let app = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', 'utf8');

const targetBlock = `      // Sync Modal (Multi-Device Laptop <-> HP)
      if (state.activeModal === 'sync_modal') {
        return \`
          <div class="modal-overlay" onclick="if(event.target === this) App.closeModal();">
            <div class="modal-card" style="max-width: 520px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <h3 style="font-size: 16px; font-weight: bold;">📱 Sinkronisasi Real-Time (Laptop ↔ HP)</h3>
                <button type="button" class="btn btn-outline" onclick="App.closeModal()" style="padding: 4px 8px; font-size: 12px; border-radius: 8px;">✕</button>
              </div>

              <div style="padding: 14px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🟢</span>
                <div>
                  <div style="font-weight: bold; font-size: 13px; color: #065F46;">🟢 Sinkron Real-Time Aktif (Laptop ↔ HP)</div>
                  <div style="font-size: 11px; color: #047857; margin-top: 2px;">Data pesanan hijab, stok katalog, aktivitas butik, dan pesan chat terhubung seketika antar-perangkat.</div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Kode Saluran Sinkron (Sync Room Topic)</label>
                <div style="display: flex; gap: 8px;">
                  <input id="sync-room-input" class="form-control" value="\${escapeHtml(App.getSyncRoom())}" placeholder="bynvdila_crm_sync_channel">
                  <button type="button" class="btn btn-primary" onclick="App.saveSyncRoom()">Simpan Room</button>
                </div>
                <p style="font-size: 10.5px; color: #777; margin-top: 4px;">Pastikan laptop dan HP menggunakan kode saluran yang sama.</p>
              </div>

              <div class="card" style="margin-bottom: 16px; background: #FAF8F5; border: 1px solid var(--border);">
                <h4 style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">Cara Buka di HP (Smartphone):</h4>
                <ol style="padding-left: 18px; font-size: 11.5px; color: #555; line-height: 1.6; margin: 0;">
                  <li>Buka browser di HP Anda (Chrome / Safari / Firefox).</li>
                  <li>Ketik alamat butik: <strong>https://hijabsell.vercel.app</strong> atau <strong>https://hijabkuu.vercel.app</strong></li>
                  <li>Aktivitas pemesanan, penambahan produk, atau chat akan langsung sinkron secara otomatis!</li>
                </ol>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="btn btn-outline" onclick="App.copyHpLink()">📋 Salin Link Butik HP</button>
                <div style="display: flex; gap: 8px;">
                  <button type="button" class="btn btn-secondary" onclick="App.syncAllWithCloud()">🔄 Sinkronkan Sekarang</button>
                  <button type="button" class="btn btn-primary" onclick="App.closeModal()">Tutup</button>
                </div>
              </div>
            </div>
          </div>
        \`;
      }`;

if (!app.includes(targetBlock)) {
  console.error('Target block not found!');
  process.exit(1);
}

app = app.replace(targetBlock, '');

fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html', app, 'utf8');
fs.writeFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html', app, 'utf8');

const check = fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html', 'utf8');
console.log('Contains Sinkron Real-Time Aktif (Laptop ↔ HP):', check.includes('Sinkron Real-Time Aktif (Laptop ↔ HP)'));
console.log('Byte identical:', fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html').equals(fs.readFileSync('C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html')));
