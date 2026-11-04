import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Store,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export default function SettingsView({
  onLoadSampleData,
  onResetToEmpty,
  onExportJSON,
  onImportJSON,
}) {
  const [successMsg, setSuccessMsg] = useState('');

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        onImportJSON(json);
        showNotification('Data backup berhasil diimpor ke sistem!');
      } catch (err) {
        alert('File JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
          Pengaturan Sistem & Manajemen Data
        </h2>
        <p className="text-xs text-stone-500">
          Kelola profil brand, saluran marketplace, serta pemuatan data uji & reset empty state
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Brand Profile Card */}
      <div className="bg-white rounded-2xl border border-nvdila-warm/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-nvdila-cream border border-nvdila-warm flex items-center justify-center font-serif font-bold text-nvdila-charcoal text-lg">
            N
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
              Profil Brand BY.NVDILA
            </h3>
            <p className="text-xs text-stone-500">
              Identitas sistem Customer Relationship Management khusus hijab
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-stone-400 block mb-1">Nama Brand</span>
            <input
              type="text"
              readOnly
              value="BY.NVDILA"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-stone-800"
            />
          </div>

          <div>
            <span className="text-stone-400 block mb-1">Kategori Usaha</span>
            <input
              type="text"
              readOnly
              value="Hijab, Pashmina & Modest Fashion"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800"
            />
          </div>

          <div className="sm:col-span-2">
            <span className="text-stone-400 block mb-1">Fokus Operasional</span>
            <p className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 leading-relaxed">
              BY.NVDILA beroperasi sebagai sistem manajemen butik hijab elegan untuk mengkonsolidasikan data pelanggan, riwayat belanja, katalog produk hijab, kalkulasi segmentasi loyalitas, dan sinkronisasi real-time antara laptop admin dan smartphone pelanggan.
            </p>
          </div>
        </div>
      </div>



      {/* Marketplace Status Indicator */}
      <div className="bg-white rounded-2xl border border-nvdila-warm/80 p-6 shadow-2xs space-y-4">
        <h3 className="font-serif text-base font-semibold text-nvdila-charcoal border-b border-stone-100 pb-2 flex items-center gap-2">
          <Store className="w-4 h-4 text-nvdila-mocha" />
          Integrasi Saluran Penjualan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
            <div>
              <p className="font-semibold text-xs text-stone-800">Shopee Indonesia</p>
              <span className="text-[10px] text-emerald-700 font-medium">Terhubung Aktif</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
            <div>
              <p className="font-semibold text-xs text-stone-800">TikTok Shop</p>
              <span className="text-[10px] text-emerald-700 font-medium">Terhubung Aktif</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>

          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
            <div>
              <p className="font-semibold text-xs text-stone-800">Tokopedia</p>
              <span className="text-[10px] text-emerald-700 font-medium">Terhubung Aktif</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </div>

      {/* DATA MANAGEMENT (Backup & Restore) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-stone-900">
              Penyimpanan Data & Cadangan
            </h3>
            <p className="text-xs text-stone-500">
              Sistem beroperasi dengan data nyata tersimpan di browser lokal. Anda dapat mengekspor atau mengimpor data kapan saja.
            </p>
          </div>
        </div>

        {/* JSON Backup & Restore */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-stone-500 font-medium">Backup & Restore File Database:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-medium cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Impor JSON</span>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
