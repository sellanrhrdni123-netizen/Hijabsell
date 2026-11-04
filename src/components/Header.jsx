import React from 'react';
import { Plus, Bell, Calendar, Store, ShieldAlert, Menu } from 'lucide-react';

export default function Header({
  title,
  subtitle,
  onOpenAddCustomer,
  onOpenAddProduct,
  onOpenAddOrder,
  onOpenAddFollowUp,
  onToggleSidebar,
  user,
}) {
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 bg-nvdila-bg/80 backdrop-blur-md border-b border-nvdila-warm/80 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl bg-white border border-nvdila-warm text-nvdila-charcoal hover:bg-nvdila-cream transition"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-nvdila-charcoal">
                {title}
              </h2>
              <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-nvdila-cream border border-nvdila-warm text-nvdila-darkMocha font-medium">
                BY.NVDILA Modest Wear
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Date Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-nvdila-warm/80 text-xs text-stone-600 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-nvdila-mocha" />
            <span>{todayFormatted}</span>
          </div>

          {/* Real-time Cross-Device Sync Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-emerald-700">🟢 Sinkron Real-Time Aktif (Laptop ↔ HP)</span>
          </div>

          {/* Quick Actions Dropdown / Buttons */}
          <div className="flex items-center gap-2">
            {onOpenAddCustomer && (
              <button
                type="button"
                onClick={onOpenAddCustomer}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-nvdila-sand hover:bg-nvdila-cream text-nvdila-charcoal text-xs font-medium transition shadow-2xs"
                title="Tambah Pelanggan Baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Pelanggan</span>
              </button>
            )}

            {onOpenAddProduct && (
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-nvdila-sand hover:bg-nvdila-cream text-nvdila-charcoal text-xs font-medium transition shadow-2xs"
                title="Tambah Produk Baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Produk</span>
              </button>
            )}

            {onOpenAddOrder && (
              <button
                type="button"
                onClick={onOpenAddOrder}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-xs font-medium transition shadow-sm"
                title="Buat Pesanan Baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pesanan</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
