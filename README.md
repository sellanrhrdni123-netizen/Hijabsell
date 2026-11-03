# by.Nvdila — CRM Khusus Brand Hijab

Aplikasi web Customer Relationship Management (CRM) internal yang dirancang khusus untuk brand modest fashion & hijab **by.Nvdila**.

Aplikasi ini membantu admin mengelola data pelanggan, stok hijab, pesanan dari marketplace (Shopee, TikTok Shop, Tokopedia, WhatsApp), riwayat pembelian, segmentasi loyalitas, customer insight nyata, serta otomasi jadwal follow-up pelanggan.

---

## 🌸 Filosofi Desain & Karakteristik Brand
- **Gaya Desain:** Modern, Minimalis, Elegan, Bersih, dan Profesional.
- **Warna Identitas:** Off-white/cream hangat (`#FAF8F5`, `#F4EFEB`), aksen mocha & nude taupe (`#8C7A6B`, `#5C4E44`), teks charcoal (`#332C2B`), dan rounded cards (`rounded-2xl`).
- **Bahasa:** 100% Bahasa Indonesia untuk seluruh label, tombol, tabel, dan pesan empty state.

---

## ⚠️ Kebijakan Ketat "Zero Dummy Data" (Data Nyata & Empty State)
Sesuai instruksi dan kebutuhan evaluasi:
1. **Initial State (Data Kosong 100%):**
   - Saat aplikasi pertama kali dibuka, **tidak ada data fiktif** di tabel, grafik, maupun profil pelanggan.
   - Semua halaman menampilkan pesan **Empty State** yang informatif:
     - *"Belum ada pelanggan"* [+ Tambah Pelanggan]
     - *"Belum ada produk"* [+ Tambah Produk]
     - *"Belum ada pesanan"* [+ Tambah Pesanan]
     - *"Belum ada aktivitas"*
     - *"Insight akan tersedia setelah terdapat data pelanggan dan transaksi."*
2. **Fitur Pengujian Khusus Reviewer (Menu Pengaturan / Settings):**
   - **Muat Data Sampel Uji:** Memuat data realistis hijab by.Nvdila (Pashmina Viscose Modal, Hijab Instan/Tali, Bergo Instan Praktis, Inner/Ciput, pesanan marketplace, dan riwayat follow-up) untuk menguji kalkulasi formula & grafik analitik.
   - **Reset ke Data Kosong (Empty State):** Mengosongkan kembali database ke kondisi awal 100% murni.
   - **Ekspor & Impor JSON Backup:** Untuk menyimpan dan memulihkan state lokal.

---

## 👥 Role & Akses
1. **Login Wall Wajib:**
   - Baik Admin CRM maupun Customer wajib login terlebih dahulu sebelum masuk ke dashboard.
   - Sesi diawali dengan `null` pada saat load, dan diautentikasi sesuai dengan email yang diketik oleh pengguna.
2. **Admin CRM (Fokus Utama):**
   - **Dashboard:** KPI total pelanggan, new customers, total pesanan, omset penjualan nyata, repeat customers, grafik tren, segmentasi bar, pesanan & aktivitas terbaru.
   - **Customers (Pelanggan):** Pencarian, filter segmentasi, tambah/edit/hapus pelanggan, detail profil pelanggan lengkap.
   - **Customer Detail:** Info kontak, metrik pengeluaran, riwayat seluruh pembelian, produk favorit yang pernah dibeli, timeline aktivitas, tombol WhatsApp, dan catatan follow-up.
   - **Products (Produk):** Manajemen stok hijab, varian warna, kategori resmi by.Nvdila (Pashmina Viscose Modal, Hijab Instan/Tali, Bergo Instan Praktis, Inner/Ciput), harga jual, status ketersediaan, serta tombol penyesuaian stok cepat.
   - **Orders (Pesanan):** Pencatatan pesanan dari Shopee, TikTok Shop, Tokopedia, dan WhatsApp, multi-item picker, kalkulasi total otomatis, filter status pesanan & pembayaran, tracking nomor resi, dan tombol invoice WhatsApp.
   - **Customer Insight:** Analisis Repeat Purchase Rate, Average Order Value (AOV), Average Revenue per Customer (ARPU), Top Customers, Most Purchased Products, dan daftar Inactive Customers untuk reaktivasi.
   - **Follow-up:** Pipeline reminder sapaan pelanggan baru, penawaran warna hijab baru, reaktivasi pelanggan non-aktif, dengan pesan template WhatsApp yang siap dikirim langsung via `wa.me`.
   - **Reports (Laporan):** Filter periode (Hari Ini, 7 Hari Terakhir, Bulan Ini, Rentang Kustom), ringkasan omset terfilter, tabel rincian transaksi, tombol Export CSV, dan Cetak / PDF.
   - **Settings (Pengaturan):** Profil brand, status integrasi marketplace, opsi muat data sampel uji & reset empty state.

2. **Customer / User Portal:**
   - **Katalog Hijab:** Tampilan etalase foto hijab by.Nvdila, filter kategori, harga, dan tombol pesanan cepat via WhatsApp.
   - **Pesanan Saya:** Melacak status pengiriman dan nomor resi pesanan aktif.
   - **Riwayat Pembelian:** Arsip pembelian selesai.
   - **Profil Pelanggan:** Informasi akun, alamat pengiriman, dan status membership loyalty per pelanggan.

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Buka Langsung di Browser (Zero Build / Tanpa Install)
Aplikasi telah dilengkapi dengan berkas mandiri `app.html` dan `index.html`.
Cukup **klik dua kali (double click)** atau buka berkas berikut di browser (Google Chrome, Microsoft Edge, Firefox):
```
file:///C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/app.html
```
atau
```
file:///C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html
```
*Catatan: Seluruh dependensi (React 18, Tailwind CSS, LocalStorage persistence) berjalan langsung di browser tanpa perlu server.*

### Opsi 2: Jalankan via Vite Dev Server
Jika ingin menggunakan Node.js dan Vite:
```bash
cd C:\Users\sella\.gemini\antigravity\scratch\by-nvdila-crm
npm install
npm run dev
```
Buka browser pada alamat `http://localhost:5173`.

---

## 📂 Struktur Berkas Proyek
```
by-nvdila-crm/
├── app.html                       # Berkas mandiri lengkap (bisa dibuka langsung)
├── index.html                     # Entry point Vite & fallback otomatis
├── package.json                   # Konfigurasi npm
├── vite.config.js                 # Konfigurasi Vite
├── tailwind.config.js             # Konfigurasi tema warna by.Nvdila
├── postcss.config.js              # PostCSS autoprefixer
├── README.md                      # Dokumentasi teknis aplikasi
└── src/
    ├── main.jsx                   # Entry point React
    ├── App.jsx                    # Root component & state orchestration
    ├── index.css                  # Style global & typography
    ├── utils/
    │   └── storage.js             # LocalStorage, kalkulasi formula & sampel uji
    └── components/
        ├── EmptyState.jsx         # Komponen reusable Empty State
        ├── Sidebar.jsx            # Navigasi Admin CRM
        ├── Header.jsx             # Top bar & tombol aksi cepat
        ├── LoginView.jsx          # Login & role switcher
        ├── DashboardView.jsx      # Dashboard utama CRM
        ├── CustomersView.jsx      # Daftar & filter pelanggan
        ├── CustomerDetailView.jsx # Profil mendalam pelanggan & riwayat
        ├── ProductsView.jsx       # Katalog & inventaris stok hijab
        ├── OrdersView.jsx         # Manajemen pesanan marketplace
        ├── InsightView.jsx        # Analisis Customer Insight nyata
        ├── FollowUpView.jsx       # CRM Reminder & template WhatsApp
        ├── ReportsView.jsx        # Laporan berkala, export CSV & print
        ├── SettingsView.jsx       # Profil brand & opsi reset/sample data
        ├── CustomerPortal.jsx     # Portal khusus role pelanggan
        ├── CustomerModal.jsx      # Modal input/edit pelanggan
        ├── ProductModal.jsx       # Modal input/edit produk hijab
        ├── OrderModal.jsx         # Modal input/edit pesanan
        ├── FollowUpModal.jsx      # Modal input/edit follow-up
        └── DeleteConfirmModal.jsx # Modal konfirmasi penghapusan aman
```

---

## 🗄️ Integrasi Database Cloud Supabase

Aplikasi telah dilengkapi dengan skema database PostgreSQL lengkap untuk **Supabase**:

### 1. Berkas Skema & Alat Supabase
- **`supabase-schema.sql`**: Berkas DDL PostgreSQL siap pakai yang mencakup 8 tabel utama (`users`, `store_settings`, `products`, `customers`, `orders`, `followups`, `chats`, `activities`), trigger otomatis `updated_at`, fungsi stored procedure `cancel_customer_order` dengan pengembalian stok, Row Level Security (RLS), dan publikasi realtime.
- **`test-supabase-connection.cjs`**: Skrip verifikasi koneksi & kelengkapan tabel.
- **`sync-local-to-supabase.cjs`**: Skrip sinkronisasi data awal (akun admin & pengaturan toko) ke Supabase.
- **`src/utils/supabaseClient.js`**: Helper REST API untuk integrasi langsung tanpa dependensi berat.

### 2. Langkah Cepat Menghubungkan ke Supabase
1. Buat proyek gratis di [supabase.com](https://supabase.com).
2. Masuk ke menu **SQL Editor** di dashboard Supabase.
3. Buka berkas `supabase-schema.sql`, salin seluruh isinya, tempel ke SQL Editor, lalu klik **Run**.
4. Ambil **Project URL** dan **anon public key** dari menu **Project Settings > API**.
5. Buat file `.env` (atau salin dari `.env.example`) dan masukkan kredensial:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. Jalankan pemeriksaan koneksi:
   ```bash
   node test-supabase-connection.cjs
   ```
7. Jalankan sinkronisasi data awal:
   ```bash
   node sync-local-to-supabase.cjs
   ```

